package oripa.gui.presenter.creasepattern.geometry;

import java.util.Collection;

import javax.vecmath.Vector2d;

import oripa.domain.paint.PaintContextInterface;
import oripa.geom.GeomUtil;
import oripa.value.CalculationResource;
import oripa.value.OriLine;

/**
 * Logics using ORIPA data and mouse point in geometric form.
 *
 * @author koji
 *
 */
public class NearestItemFinder {

	private static double scaleThreshold(final PaintContextInterface context) {
		return CalculationResource.CLOSE_THRESHOLD / context.getScale();
	}

	// returns the OriLine sufficiently closer to point p
	public static OriLine pickLine(final Collection<OriLine> lines,
			final Vector2d p, final double scale) {
		double minDistance = Double.MAX_VALUE;
		OriLine bestLine = null;

		for (OriLine line : lines) {
			double dist = GeomUtil.distancePointToSegment(new Vector2d(p.x, p.y), line.p0, line.p1);
			if (dist < minDistance) {
				minDistance = dist;
				bestLine = line;
			}
		}

		if (minDistance / scale < 10) {
			return bestLine;
		} else {
			return null;
		}
	}

	public static Vector2d pickVertex(
			final PaintContextInterface context, final boolean freeSelection) {

		NearestPoint nearestPosition;

		nearestPosition = NearestVertexFinder.findAround(context, scaleThreshold(context));

		Vector2d picked = null;

		if (nearestPosition != null) {
			picked = new Vector2d(nearestPosition.point);
		}

		if (picked == null && freeSelection == true) {
			var currentPoint = context.getLogicalMousePoint();

			OriLine l = pickLine(context);
			if (l != null) {
				picked = new Vector2d();
				Vector2d cp = new Vector2d(currentPoint.x, currentPoint.y);

				GeomUtil.distancePointToSegment(cp, l.p0, l.p1, picked);
			}
		}

		return picked;
	}

	public static Vector2d pickVertexFromPickedLines(final PaintContextInterface context) {

		NearestPoint nearestPosition;
		nearestPosition = NearestVertexFinder.findFromPickedLine(context);

		Vector2d picked = null;
		if (nearestPosition.distance < scaleThreshold(context)) {
			picked = nearestPosition.point;
		}

		return picked;
	}

	public static OriLine pickLine(final PaintContextInterface context) {
		return pickLine(context.getCreasePattern(), context.getLogicalMousePoint(),
				context.getScale());
	}

	public static Vector2d getCandidateVertex(final PaintContextInterface context,
			final boolean enableMousePoint) {

		Vector2d candidate = context.getCandidateVertexToPick();

		if (candidate == null && enableMousePoint) {
			var mp = context.getLogicalMousePoint();
			candidate = new Vector2d(mp.x, mp.y);
		}

		return candidate;
	}

	public static Vector2d getNearestInAngleSnapCrossPoints(final PaintContextInterface context) {
		return NearestVertexFinder.findNearestVertex(
				context.getLogicalMousePoint(),
				context.getAngleSnapCrossPoints()).point;
	}

}
