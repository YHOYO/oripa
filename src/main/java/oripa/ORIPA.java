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

package oripa;

import java.awt.Dimension;
import java.awt.Toolkit;

import javax.swing.JFrame;
import javax.swing.SwingUtilities;

import oripa.gui.presenter.main.MainFramePresenter;
import oripa.gui.view.main.MainFrame;

public class ORIPA {
	public static void main(final String[] args) {
		SwingUtilities.invokeLater(() -> {
			int uiPanelWidth = 0;// 150;

			int mainFrameWidth = 1000;
			int mainFrameHeight = 800;

			int appTotalWidth = mainFrameWidth + uiPanelWidth;
			int appTotalHeight = mainFrameHeight;

			// Construction of the main frame
			var mainFrame = new MainFrame();

			Toolkit toolkit = mainFrame.getToolkit();
			Dimension dim = toolkit.getScreenSize();
			int originX = (int) (dim.getWidth() / 2 - appTotalWidth / 2);
			int originY = (int) (dim.getHeight() / 2 - appTotalHeight / 2);

			mainFrame.setBounds(originX + uiPanelWidth, originY, mainFrameWidth, mainFrameHeight);
			mainFrame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

			var presenter = new MainFramePresenter(mainFrame);
			presenter.setViewVisible(true);

//			if (Config.FOR_STUDY) {
//				int modelFrameWidth = 400;
//				int modelFrameHeight = 400;
//				modelFrame3D = new ModelViewFrame3D();
//				modelFrame3D.setBounds(0, 0,
//						modelFrameWidth * 2, modelFrameHeight * 2);
//				modelFrame3D.setVisible(true);
//			}
		});
	}

}
