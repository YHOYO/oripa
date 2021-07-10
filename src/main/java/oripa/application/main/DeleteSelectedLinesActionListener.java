package oripa.application.main;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import oripa.domain.cptool.Painter;
import oripa.domain.paint.PaintContext;
import oripa.gui.presenter.creasepattern.ScreenUpdater;

public class DeleteSelectedLinesActionListener implements ActionListener {
	private static final Logger logger = LoggerFactory
			.getLogger(DeleteSelectedLinesActionListener.class);
	private final PaintContext context;
	private final ScreenUpdater screenUpdater;

	public DeleteSelectedLinesActionListener(final PaintContext aContext,
			final ScreenUpdater updater) {
		context = aContext;
		screenUpdater = updater;
	}

	@Override
	public void actionPerformed(final ActionEvent e) {

		context.creasePatternUndo().pushUndoInfo();

		Painter painter = context.getPainter();

		try {
			painter.removeSelectedLines();
		} catch (Exception ex) {
			logger.error("error when deleting selected lines", ex);
		}
		if (context.isPasting() == false) {
			context.clear(false);
		}

		screenUpdater.updateScreen();

	}

}
