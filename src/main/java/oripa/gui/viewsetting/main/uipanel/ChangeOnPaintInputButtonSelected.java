package oripa.gui.viewsetting.main.uipanel;

import oripa.gui.viewsetting.ChangeViewSetting;

public class ChangeOnPaintInputButtonSelected implements ChangeViewSetting {
	private final UIPanelSetting setting;

	/**
	 * UIPanel view settings for lineInput edit mode selected
	 */
	public ChangeOnPaintInputButtonSelected(final UIPanelSetting uiPanelSetting) {
		setting = uiPanelSetting;
	}

	@Override
	public void changeViewSetting() {
		setting.selectInputMode();

		setting.setByValuePanelVisible(false);
		setting.setLineInputPanelVisible(true);
		setting.setAngleStepPanelVisible(false);

		setting.setAlterLineTypePanelVisible(false);
	}

}
