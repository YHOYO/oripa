package oripa.domain.paint.pbisec;

import javax.vecmath.Vector2d;

import oripa.domain.cptool.Painter;
import oripa.domain.paint.PaintContext;
import oripa.domain.paint.core.PickingVertex;

public class SelectingSecondVertexForBisector extends PickingVertex {

	public SelectingSecondVertexForBisector() {
		super();
	}

	@Override
	protected void onResult(final PaintContext context, final boolean doSpecial) {

		if (context.getVertexCount() != 2) {
			throw new IllegalStateException();
		}

		Vector2d p0, p1;
		p0 = context.getVertex(0);
		p1 = context.getVertex(1);

		context.creasePatternUndo().pushUndoInfo();

		Painter painter = context.getPainter();
		painter.addPBisector(
				p0, p1, context.getPaperDomain(), context.getLineTypeOfNewLines());

		context.clear(false);
	}

	@Override
	protected void initialize() {
		setPreviousClass(SelectingFirstVertexForBisector.class);
		setNextClass(SelectingFirstVertexForBisector.class);

//		System.out.println("SelectingFirstVertex.initialize() is called");
	}

}
