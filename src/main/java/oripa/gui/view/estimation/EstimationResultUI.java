/**
 * ORIPA - Origami Pattern Editor Copyright (C) 2005-2009 Jun Mitani
 * http://mitani.cs.tsukuba.ac.jp/
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */
package oripa.gui.view.estimation;

import java.awt.Dimension;
import java.awt.Rectangle;
import java.awt.event.ItemEvent;

import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JLabel;
import javax.swing.JPanel;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import oripa.application.estimation.EstimationResultFileAccess;
import oripa.domain.fold.FoldedModel;
import oripa.domain.fold.OverlapRelationList;
import oripa.persistent.entity.FoldedModelDAO;
import oripa.persistent.entity.FoldedModelFilterSelector;
import oripa.resource.ResourceHolder;
import oripa.resource.ResourceKey;
import oripa.resource.StringID;
import oripa.util.gui.Dialogs;

public class EstimationResultUI extends JPanel {
	private static final Logger logger = LoggerFactory.getLogger(EstimationResultUI.class);

	private static final long serialVersionUID = 1L;
	private JButton jButtonNextAnswer = null;
	private JButton jButtonPrevAnswer = null;
	private JCheckBox jCheckBoxOrder = null;
	private JCheckBox jCheckBoxShadow = null;
	private JLabel indexLabel = null;
	private FoldedModelScreen screen;
	private JCheckBox jCheckBoxUseColor = null;
	private JCheckBox jCheckBoxEdge = null;
	private JCheckBox jCheckBoxFillFace = null;
	private JButton jButtonExport = null;

	// TODO: create label resource and apply it.
	private final ResourceHolder resources = ResourceHolder.getInstance();

	private String lastFilePath = null;

	/**
	 * This is the default constructor
	 */
	public EstimationResultUI() {
		super();
		initialize();
	}

	public void setScreen(final FoldedModelScreen s) {
		screen = s;
	}

	/**
	 * This method initializes this
	 *
	 * @return void
	 */
	private void initialize() {
		indexLabel = new JLabel();
		indexLabel.setBounds(new Rectangle(15, 45, 181, 16));
		this.setLayout(null);
		this.setSize(216, 256);
		this.setPreferredSize(new Dimension(216, 200));
		this.add(getJButtonPrevAnswer(), null);
		this.add(getJCheckBoxOrder(), null);
		this.add(getJButtonNextAnswer(), null);
		this.add(getJCheckBoxShadow(), null);
		this.add(indexLabel, null);
		this.add(getJCheckBoxUseColor(), null);
		this.add(getJCheckBoxEdge(), null);
		this.add(getJCheckBoxFillFace(), null);
		this.add(getJButtonExport(), null);
		updateIndexLabel();
	}

	private FoldedModel foldedModel;
	private OverlapRelationList overlapRelationList = null;

	/**
	 * @param overlapRelationList
	 */
	public void setModel(final FoldedModel foldedModel) {
		this.foldedModel = foldedModel;
		this.overlapRelationList = foldedModel.getOverlapRelationList();
	}

	public void updateIndexLabel() {

		if (overlapRelationList == null) {
			return;
		}

		indexLabel.setText("Folded model ["
				+ (overlapRelationList.getCurrentORmatIndex() + 1) + "/"
				+ overlapRelationList.getFoldablePatternCount() + "]");

	}

	/**
	 * This method initializes jButtonNextAnswer
	 *
	 * @return javax.swing.JButton
	 */
	private JButton getJButtonNextAnswer() {

		if (jButtonNextAnswer != null) {
			return jButtonNextAnswer;
		}

		jButtonNextAnswer = new JButton();
		jButtonNextAnswer.setText("Next");
		jButtonNextAnswer.setBounds(new Rectangle(109, 4, 87, 27));

		jButtonNextAnswer.addActionListener(e -> {
			overlapRelationList.setNextIndex();
			screen.redrawOrigami();
			updateIndexLabel();
		});

		return jButtonNextAnswer;
	}

	/**
	 * This method initializes jButtonPrevAnswer
	 *
	 * @return javax.swing.JButton
	 */
	private JButton getJButtonPrevAnswer() {
		if (jButtonPrevAnswer != null) {
			return jButtonPrevAnswer;
		}

		jButtonPrevAnswer = new JButton();
		jButtonPrevAnswer.setText("Prev");
		jButtonPrevAnswer.setBounds(new Rectangle(15, 4, 89, 27));

		jButtonPrevAnswer.addActionListener(e -> {
			overlapRelationList.setPrevIndex();
			screen.redrawOrigami();
			updateIndexLabel();
		});

		return jButtonPrevAnswer;
	}

	/**
	 * This method initializes jCheckBoxOrder
	 *
	 * @return javax.swing.JCheckBox
	 */
	private JCheckBox getJCheckBoxOrder() {
		if (jCheckBoxOrder != null) {
			return jCheckBoxOrder;
		}

		jCheckBoxOrder = new JCheckBox();
		jCheckBoxOrder.setBounds(new Rectangle(15, 75, 91, 31));
		jCheckBoxOrder.setText("Flip");
		jCheckBoxOrder.addItemListener(e -> {
			screen.flipFaces(e.getStateChange() == ItemEvent.SELECTED);
		});

		return jCheckBoxOrder;

	}

	/**
	 * This method initializes jCheckBoxShadow
	 *
	 * @return javax.swing.JCheckBox
	 */
	private JCheckBox getJCheckBoxShadow() {
		if (jCheckBoxShadow != null) {
			return jCheckBoxShadow;
		}

		jCheckBoxShadow = new JCheckBox();
		jCheckBoxShadow.setBounds(new Rectangle(105, 75, 80, 31));
		jCheckBoxShadow.setText("Shade");

		jCheckBoxShadow.addItemListener(e -> {
			screen.shadeFaces(e.getStateChange() == ItemEvent.SELECTED);
		});

		return jCheckBoxShadow;
	}

	/**
	 * This method initializes jCheckBoxUseColor
	 *
	 * @return javax.swing.JCheckBox
	 */
	private JCheckBox getJCheckBoxUseColor() {
		if (jCheckBoxUseColor != null) {
			return jCheckBoxUseColor;
		}

		jCheckBoxUseColor = new JCheckBox();
		jCheckBoxUseColor.setBounds(new Rectangle(15, 120, 80, 31));
		jCheckBoxUseColor.setSelected(true);
		jCheckBoxUseColor.setText("Use Color");

		jCheckBoxUseColor.addItemListener(e -> {
			screen.setUseColor(e.getStateChange() == ItemEvent.SELECTED);
		});

		return jCheckBoxUseColor;
	}

	/**
	 * This method initializes jCheckBoxEdge
	 *
	 * @return javax.swing.JCheckBox
	 */
	private JCheckBox getJCheckBoxEdge() {
		if (jCheckBoxEdge != null) {
			return jCheckBoxEdge;
		}

		jCheckBoxEdge = new JCheckBox();
		jCheckBoxEdge.setBounds(new Rectangle(105, 120, 93, 31));
		jCheckBoxEdge.setSelected(true);
		jCheckBoxEdge.setText("Draw Edge");

		jCheckBoxEdge.addItemListener(e -> {
			screen.drawEdge(e.getStateChange() == ItemEvent.SELECTED);
		});

		return jCheckBoxEdge;

	}

	/**
	 * This method initializes jCheckBoxFillFace
	 *
	 * @return javax.swing.JCheckBox
	 */
	private JCheckBox getJCheckBoxFillFace() {
		if (jCheckBoxFillFace != null) {
			return jCheckBoxFillFace;
		}

		jCheckBoxFillFace = new JCheckBox();
		jCheckBoxFillFace.setBounds(new Rectangle(15, 165, 93, 21));
		jCheckBoxFillFace.setSelected(true);
		jCheckBoxFillFace.setText("FillFace");

		jCheckBoxFillFace.addItemListener(e -> {
			screen.setFillFace(e.getStateChange() == ItemEvent.SELECTED);
		});

		return jCheckBoxFillFace;
	}

	/**
	 * This method initializes jButtonExport
	 *
	 * @return javax.swing.JButton
	 */
	private JButton getJButtonExport() {
		if (jButtonExport != null) {
			return jButtonExport;
		}

		jButtonExport = new JButton();
		jButtonExport.setBounds(new Rectangle(15, 206, 92, 26));
		jButtonExport.setText("Export");
		jButtonExport.addActionListener(e -> export());

		return jButtonExport;
	}

	private void export() {
		try {
			var filterSelector = new FoldedModelFilterSelector(screen.isFaceOrderFlipped());
			final FoldedModelDAO dao = new FoldedModelDAO(filterSelector);
			EstimationResultFileAccess fileAccess = new EstimationResultFileAccess(dao);
			lastFilePath = fileAccess.saveFile(foldedModel, lastFilePath, this,
					filterSelector.getSavables());
		} catch (Exception ex) {
			logger.error("error: ", ex);
			Dialogs.showErrorDialog(this, resources.getString(
					ResourceKey.ERROR, StringID.Error.SAVE_FAILED_ID), ex);
		}
	}
}