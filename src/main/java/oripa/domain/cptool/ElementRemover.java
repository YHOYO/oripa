package oripa.domain.cptool;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import javax.vecmath.Vector2d;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import oripa.domain.cptool.compgeom.PointAndLine;
import oripa.domain.cptool.compgeom.SharedPointsMap;
import oripa.domain.cptool.compgeom.SharedPointsMapFactory;
import oripa.geom.GeomUtil;
import oripa.util.StopWatch;
import oripa.value.OriLine;
import oripa.value.OriPoint;

/**
 * This class defines how to remove line/vertex from crease pattern.
 *
 * @author Koji
 *
 */
public class ElementRemover {
	private static final Logger logger = LoggerFactory.getLogger(ElementRemover.class);
	private static final double EPS = 1e-4;

	/**
	 * remove line from crease pattern
	 *
	 * @param l
	 * @param creasePattern
	 */
	public void removeLine(
			final OriLine l, final Collection<OriLine> creasePattern) {

		creasePattern.remove(l);

		// merge the lines if possible, to prevent unnecessary vertices
		var sharedLines = createSharedLines(l.p0, creasePattern);
		merge2LinesAt(l.p0, sharedLines, creasePattern);
		sharedLines = createSharedLines(l.p1, creasePattern);
		merge2LinesAt(l.p1, sharedLines, creasePattern);
	}

	private List<OriLine> createSharedLines(final Vector2d p,
			final Collection<OriLine> creasePattern) {
		return creasePattern.parallelStream()
				.filter(line -> isConnectionPoint(line.p0, p)
						|| isConnectionPoint(line.p1, p))
				.collect(Collectors.toList());
	}

	/**
	 * remove vertex from crease pattern
	 *
	 * @param v
	 * @param creasePattern
	 */
	public void removeVertex(
			final Vector2d v, final Collection<OriLine> creasePattern) {

		List<OriLine> sharedLines = createSharedLines(v, creasePattern);

		merge2LinesAt(v, sharedLines, creasePattern);
	}

	private OriLine merge2LinesAt(
			final Vector2d connectionPoint, final List<OriLine> sharedLines,
			final Collection<OriLine> creasePattern) {

		if (sharedLines.size() != 2) {
			return null;
		}

		OriLine l0 = sharedLines.get(0);
		OriLine l1 = sharedLines.get(1);

		if (!isMergePossible(l0, l1)) {
			return null;
		}

		// Merge possibility found
		OriLine line = merge(connectionPoint, l0, l1);

		creasePattern.remove(l0);
		creasePattern.remove(l1);
		creasePattern.add(line);

		return line;
	}

	private OriLine merge2LinesAt(
			final Vector2d connectionPoint, final ArrayList<PointAndLine> sharedPoints,
			final Collection<OriLine> creasePattern) {

		return merge2LinesAt(
				connectionPoint,
				sharedPoints.stream()
						.map(point -> point.getLine())
						.collect(Collectors.toList()),
				creasePattern);
	}

	private boolean isConnectionPoint(final Vector2d p, final Vector2d q) {
		return GeomUtil.distance(p, q) < EPS;
	}

	private boolean isMergePossible(final OriLine l0, final OriLine l1) {
		if (l0.getType() != l1.getType()) {
			return false;
		}

		// Check if the lines have the same angle
		Vector2d dir0 = new Vector2d(l0.p1.x - l0.p0.x, l0.p1.y - l0.p0.y);
		Vector2d dir1 = new Vector2d(l1.p1.x - l1.p0.x, l1.p1.y - l1.p0.y);

		dir0.normalize();
		dir1.normalize();

		if (!GeomUtil.isParallel(dir0, dir1)) {
			return false;
		}

		return true;
	}

	private OriLine merge(final Vector2d connectionPoint, final OriLine l0, final OriLine l1) {
		Vector2d p0 = new Vector2d();
		Vector2d p1 = new Vector2d();

		if (GeomUtil.distance(l0.p0, connectionPoint) < EPS) {
			p0.set(l0.p1);
		} else {
			p0.set(l0.p0);
		}
		if (GeomUtil.distance(l1.p0, connectionPoint) < EPS) {
			p1.set(l1.p1);
		} else {
			p1.set(l1.p0);
		}

		return (new OriLine(p0, p1, l0.getType())).createCanonical();
	}

	private void trace(final String msg, final Collection<OriLine> lines) {
		logger.trace(msg + String.join("|",
				lines.stream()
						.map(l -> l.toString())
						.collect(Collectors.toList())));
	}

	private void removeBothSidesFromMap(final PointAndLine point,
			final TreeMap<OriPoint, ArrayList<PointAndLine>> sharedPointsMap) {
		sharedPointsMap.get(point.getKeyPoint()).remove(point);
		sharedPointsMap.get(point.getOppositeKeyPoint()).remove(point);
	}

	private void addBothSidesOfLineToMap(
			final OriLine line,
			final SharedPointsMap<PointAndLine> sharedPointsMap) {
		var keyPoints = List.of(
				sharedPointsMap.findKeyPoint(line.p0, EPS),
				sharedPointsMap.findKeyPoint(line.p1, EPS));

		var endPoints = keyPoints.stream()
				.map(keyPoint -> new PointAndLine(keyPoint, line))
				.collect(Collectors.toList());

		endPoints.get(0).setKeyPoint(keyPoints.get(0));
		endPoints.get(0).setOppositeKeyPoint(keyPoints.get(1));
		endPoints.get(1).setKeyPoint(keyPoints.get(1));
		endPoints.get(1).setOppositeKeyPoint(keyPoints.get(0));

		IntStream.range(0, endPoints.size()).forEach(i -> {
			sharedPointsMap.get(keyPoints.get(i)).add(endPoints.get(i));
		});

	}

	private void removeMeaninglessVertices(final Collection<OriLine> creasePattern,
			final TreeSet<OriPoint> removedLinePoints) {
		// Sweep-line approach
		// (sweep along x axis)

		// this map keeps the both sides of each line as an object holding the
		// end point and the line.
		var mapFactory = new SharedPointsMapFactory<PointAndLine>();
		var sharedPointsMap = mapFactory.create(creasePattern,
				(point, line) -> new PointAndLine(point, line), EPS);

		// try merge for each line group connected at the key of the map
		sharedPointsMap.forEach((shared, sharedPoints) -> {
			trace("sharedLines@" + shared + ": " + "#=" + sharedPoints.size(),
					sharedPoints.stream()
							.map(s -> s.getLine())
							.collect(Collectors.toList()));

			if (removedLinePoints != null) {
				var boundRemovedPoints = removedLinePoints
						.headSet(new OriPoint(shared.getX() + EPS, shared.getY() + EPS), true)
						.tailSet(new OriPoint(shared.getX() - EPS, shared.getY() - EPS));
				if (boundRemovedPoints.contains(shared)) {
					logger.trace("exists in boundRemovedPoints: " + shared);
				} else if (!boundRemovedPoints.stream()
						.anyMatch(p -> GeomUtil.distance(p, shared) < EPS)) {
					logger.trace("not to be merged: " + shared);
					return;
				}

				logger.trace("can merge at: " + shared);
			}
			var mergedLine = merge2LinesAt(shared, sharedPoints, creasePattern);

			if (mergedLine == null) {
				return;
			}

			// if the lines are merged, the consumed old lines have to be
			// deleted from the map and the new merged line has to be added
			// to the map.

			var points = List.of(sharedPoints.get(0), sharedPoints.get(1));

			// remove old lines
			points.forEach(point -> {
				removeBothSidesFromMap(point, sharedPointsMap);
			});

			// add merged line
			addBothSidesOfLineToMap(mergedLine, sharedPointsMap);
		});

	}

	public void removeMeaninglessVertices(final Collection<OriLine> creasePattern) {
		removeMeaninglessVertices(creasePattern, null);
	}

	/**
	 * remove all lines in {@code linesToBeRemoved} from {@code creasePattern}.
	 *
	 * @param linesToBeRemoved
	 * @param creasePattern
	 */
	public void removeLines(final Collection<OriLine> linesToBeRemoved,
			final Collection<OriLine> creasePattern) {
		var watch = new StopWatch(true);

		linesToBeRemoved.forEach(creasePattern::remove);

		var removedPoints = linesToBeRemoved.stream()
				.flatMap(line -> Stream.of(line.p0, line.p1))
				.collect(Collectors.toCollection(() -> new TreeSet<>()));

		// merge lines after removing all lines to be removed.
		// merging while removing makes some lines not to be removed.

		removeMeaninglessVertices(creasePattern, removedPoints);

		logger.debug("removeLines(): " + watch.getMilliSec() + "[ms]");
	}

	/**
	 * remove lines which are marked "selected" from given collection.
	 *
	 * @param creasePattern
	 *            collection of lines
	 */
	public void removeSelectedLines(
			final Collection<OriLine> creasePattern) {

		List<OriLine> selectedLines = creasePattern.parallelStream()
				.filter(line -> line.selected)
				.collect(Collectors.toList());

		removeLines(selectedLines, creasePattern);
	}

}
