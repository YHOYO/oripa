/**
 * ORIPA - Origami Pattern Editor
 * Copyright (C) 2013-     ORIPA OSS Project  https://github.com/oripa/oripa
 * Copyright (C) 2005-2009 Jun Mitani         http://mitani.cs.tsukuba.ac.jp/

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
package oripa.persistence.entity;

import java.util.SortedMap;
import java.util.TreeMap;

import oripa.domain.fold.FoldedModel;
import oripa.persistence.dao.AbstractFilterSelector;
import oripa.persistence.filetool.FileAccessSupportFilter;
import oripa.persistence.filetool.FileTypeProperty;
import oripa.resource.StringID;

/**
 * @author OUCHI Koji
 *
 */
public class FoldedModelFilterSelector extends AbstractFilterSelector<FoldedModel> {
	private final SortedMap<FileTypeProperty<FoldedModel>, FileAccessSupportFilter<FoldedModel>> filters = new TreeMap<>();

	/**
	 * Constructor
	 */
	public FoldedModelFilterSelector(final boolean modelFlip) {
		// TODO: StringID.ModelMenu.FILE_ID is tentative. Replace it with new
		// string ID.
		FoldedModelFileTypeKey key = FoldedModelFileTypeKey.ORMAT_FOLDED_MODEL;
		putFilter(key, createDescription(key, StringID.ModelMenu.FILE_ID));

		if (modelFlip) {
			key = FoldedModelFileTypeKey.SVG_FOLDED_MODEL_FLIP;
			putFilter(key, createDescription(key, StringID.ModelMenu.FILE_ID));
		} else {
			key = FoldedModelFileTypeKey.SVG_FOLDED_MODEL;
			putFilter(key, createDescription(key, StringID.ModelMenu.FILE_ID));
		}
	}

	@Override
	protected SortedMap<FileTypeProperty<FoldedModel>, FileAccessSupportFilter<FoldedModel>> getFilters() {
		return filters;
	}
}
