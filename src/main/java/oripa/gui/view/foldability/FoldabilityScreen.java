/**
 * ORIPA - Origami Pattern Editor
 * Copyright (C) 2005-2009 Jun Mitani http://mitani.cs.tsukuba.ac.jp/

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package oripa.gui.view.foldability;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.RenderingHints;
import java.awt.event.ComponentEvent;
import java.awt.event.ComponentListener;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;
import java.awt.event.MouseWheelEvent;
import java.awt.event.MouseWheelListener;
import java.awt.geom.AffineTransform;
import java.awt.geom.Point2D;
import java.util.ArrayList;
import java.util.Collection;
import java.util.function.BiFunction;
import java.util.stream.Collectors;

import javax.swing.JMenuItem;
import javax.swing.JPanel;
import javax.swing.JPopupMenu;
import javax.vecmath.Vector2d;

import oripa.domain.cptool.OverlappingLineExtractor;
import oripa.domain.fold.foldability.FoldabilityChecker;
import oripa.domain.fold.halfedge.OriFace;
import oripa.domain.fold.halfedge.OriVertex;
import oripa.domain.fold.halfedge.OrigamiModel;
import oripa.geom.RectangleDomain;
import oripa.gui.presenter.creasepattern.CreasePatternGraphicDrawer;
import oripa.gui.presenter.creasepattern.geometry.NearestVertexFinder;
import oripa.gui.presenter.foldability.FoldabilityGraphicDrawer;
import oripa.gui.view.creasepattern.ObjectGraphicDrawer;
import oripa.gui.view.util.AffineCamera;
import oripa.gui.view.util.MouseUtility;
import oripa.swing.drawer.java2d.CreasePatternObjectDrawer;
import oripa.value.CalculationResource;
import oripa.value.OriLine;

/**
 * A screen to show whether Maekawa theorem and Kawasaki theorem (and others)
 * holds.
 *
 * @author Koji
 *
 */
public class FoldabilityScreen extends JPanel
		implements MouseListener, MouseMotionListener, MouseWheelListener,
		ComponentListener {

	private final boolean bDrawFaceID = false;
	private Image bufferImage;

	private final AffineCamera camera = new AffineCamera();

	// Affine transformation information
	private AffineTransform affineTransform = new AffineTransform();

	private final JPopupMenu popup = new JPopupMenu();
	private final JMenuItem popupItem_DivideFace = new JMenuItem("Face division");
	private final JMenuItem popupItem_FlipFace = new JMenuItem("Face Inversion");

	private OrigamiModel origamiModel = null;
	private Collection<OriLine> creasePattern = null;

	private Point2D preMousePoint; // Screen coordinates

	private boolean zeroLineWidth = false;

	FoldabilityScreen() {

		addMouseListener(this);
		addMouseMotionListener(this);
		addMouseWheelListener(this);
		addComponentListener(this);

		camera.updateScale(1.5);
		setBackground(Color.WHITE);

		popup.add(popupItem_DivideFace);
		popup.add(popupItem_FlipFace);
	}

	private final FoldabilityChecker foldabilityChecker = new FoldabilityChecker();
	private Collection<OriVertex> violatingVertices = new ArrayList<>();
	private Collection<OriFace> violatingFaces = new ArrayList<>();
	private OriVertex pickedViolatingVertex;

	private Collection<OriLine> overlappingLines = new ArrayList<>();

	public void showModel(
			final OrigamiModel origamiModel,
			final Collection<OriLine> creasePattern,
			final boolean zeroLineWidth) {
		this.origamiModel = origamiModel;
		this.creasePattern = creasePattern.stream()
				.map(line -> new OriLine(line)).collect(Collectors.toList());
		this.zeroLineWidth = zeroLineWidth;

		violatingVertices = foldabilityChecker.findViolatingVertices(
				origamiModel.getVertices());

		violatingFaces = foldabilityChecker.findViolatingFaces(
				origamiModel.getFaces());

		var overlappingLineExtractor = new OverlappingLineExtractor();
		overlappingLines = overlappingLineExtractor.extract(creasePattern);

		var domain = new RectangleDomain(creasePattern);
		camera.updateCenterOfPaper(domain.getCenterX(), domain.getCenterY());

		this.setVisible(true);
	}

	private void drawFoldability(final ObjectGraphicDrawer objDrawer, final double scale) {
		FoldabilityGraphicDrawer drawer = new FoldabilityGraphicDrawer();

		drawer.draw(objDrawer, origamiModel, violatingFaces, violatingVertices, scale);
	}

	private void buildBufferImage() {
		bufferImage = createImage(getWidth(), getHeight());
		affineTransform = camera.updateCameraPosition(getWidth() * 0.5, getHeight() * 0.5);
	}

	@Override
	public void paintComponent(final Graphics g) {
		super.paintComponent(g);

		if (bufferImage == null) {
			buildBufferImage();
		}
		var bufferg = (Graphics2D) bufferImage.getGraphics();

		bufferg.setTransform(new AffineTransform());

		bufferg.setColor(Color.WHITE);
		bufferg.fillRect(0, 0, getWidth(), getHeight());

		bufferg.setTransform(affineTransform);

		if (!zeroLineWidth) {
			bufferg.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
					RenderingHints.VALUE_ANTIALIAS_ON);
		}

		ObjectGraphicDrawer bufferObjDrawer = new CreasePatternObjectDrawer(bufferg);

		var scale = camera.getScale();

		drawCreasePattern(bufferObjDrawer, scale);

		drawFoldability(bufferObjDrawer, scale);

		g.drawImage(bufferImage, 0, 0, this);

		drawVertexViolationNames(new CreasePatternObjectDrawer((Graphics2D) g));
	}

	private void drawCreasePattern(final ObjectGraphicDrawer objDrawer, final double scale) {
		CreasePatternGraphicDrawer drawer = new CreasePatternGraphicDrawer();

		drawer.highlightOverlappingLines(objDrawer, overlappingLines, scale);

		drawer.drawAllLines(objDrawer, creasePattern, scale, zeroLineWidth);
		drawer.drawCreaseVertices(objDrawer, creasePattern, scale);
	}

	private void drawVertexViolationNames(final ObjectGraphicDrawer drawer) {
		if (pickedViolatingVertex == null) {
			return;
		}

		var violationNames = foldabilityChecker.getVertexViolationNames(pickedViolatingVertex);

		drawer.drawString("error(s): " + String.join(", ", violationNames), 0, 10);
	}

	@Override
	public void componentResized(final ComponentEvent arg0) {
		if (getWidth() <= 0 || getHeight() <= 0) {
			return;
		}

		// Updating the image buffer
		buildBufferImage();
		repaint();
	}

	/*
	 * (non Javadoc)
	 *
	 * @see java.awt.event.MouseListener#mouseClicked(java.awt.event.MouseEvent)
	 */
	@Override
	public void mouseClicked(final MouseEvent e) {

	}

	/*
	 * (non Javadoc)
	 *
	 * @see java.awt.event.MouseListener#mouseEntered(java.awt.event.MouseEvent)
	 */
	@Override
	public void mouseEntered(final MouseEvent e) {

	}

	/*
	 * (non Javadoc)
	 *
	 * @see java.awt.event.MouseListener#mouseExited(java.awt.event.MouseEvent)
	 */
	@Override
	public void mouseExited(final MouseEvent e) {

	}

	/*
	 * (non Javadoc)
	 *
	 * @see java.awt.event.MouseListener#mousePressed(java.awt.event.MouseEvent)
	 */
	@Override
	public void mousePressed(final MouseEvent e) {
		preMousePoint = e.getPoint();
	}

	/*
	 * (non Javadoc)
	 *
	 * @see
	 * java.awt.event.MouseListener#mouseReleased(java.awt.event.MouseEvent)
	 */
	@Override
	public void mouseReleased(final MouseEvent e) {

	}

	/*
	 * (non Javadoc)
	 *
	 * @see java.awt.event.MouseMotionListener#mouseDragged(java.awt.event.
	 * MouseEvent)
	 */
	@Override
	public void mouseDragged(final MouseEvent e) {

		if (doCameraDragAction(e, camera::updateScaleByMouseDragged)) {
			return;
		}

		if (doCameraDragAction(e, camera::updateTranslateByMouseDragged)) {
			return;
		}
	}

	private boolean doCameraDragAction(final MouseEvent e,
			final BiFunction<MouseEvent, Point2D, AffineTransform> onDrag) {
		var affine = onDrag.apply(e, preMousePoint);
		if (affine == null) {
			return false;
		}
		preMousePoint = e.getPoint();
		affineTransform = affine;
		repaint();
		return true;
	}

	/*
	 * (non Javadoc)
	 *
	 * @see
	 * java.awt.event.MouseMotionListener#mouseMoved(java.awt.event.MouseEvent)
	 */
	@Override
	public void mouseMoved(final MouseEvent e) {
		var logicalPoint = MouseUtility.getLogicalPoint(affineTransform, e.getPoint());
		var mousePoint = new Vector2d(logicalPoint.x, logicalPoint.y);

		var nearest = NearestVertexFinder.findNearestVertex(
				mousePoint,
				violatingVertices.stream()
						.map(v -> v.getPositionBeforeFolding())
						.collect(Collectors.toList()));

		if (nearest.distance >= scaleDistanceThreshold()) {
			pickedViolatingVertex = null;
			repaint();
			return;
		}

		pickedViolatingVertex = violatingVertices.stream()
				.filter(vertex -> vertex.getPositionBeforeFolding().equals(nearest.point))
				.findFirst().get();

		repaint();
	}

	private double scaleDistanceThreshold() {
		return CalculationResource.CLOSE_THRESHOLD / camera.getScale();
	}

	@Override
	public void mouseWheelMoved(final MouseWheelEvent e) {
		affineTransform = camera.updateScaleByMouseWheel(e);
		repaint();
	}

	@Override
	public void componentMoved(final ComponentEvent arg0) {

	}

	@Override
	public void componentShown(final ComponentEvent arg0) {

	}

	@Override
	public void componentHidden(final ComponentEvent arg0) {

	}
}
