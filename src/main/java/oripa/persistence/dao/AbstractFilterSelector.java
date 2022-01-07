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
package oripa.persistence.dao;

import java.io.File;
import java.util.Collections;
import java.util.SortedMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import oripa.persistence.filetool.FileAccessSupportFilter;
import oripa.persistence.filetool.FileTypeProperty;
import oripa.persistence.filetool.MultiTypeAcceptableFileLoadingFilter;
import oripa.resource.ResourceHolder;
import oripa.resource.ResourceKey;

/**
 * A template for managing available filters for file access. Typical usage is:
 * 1) create filters in constructor, and 2) return the filters in getFilters().
 *
 * @author OUCHI Koji
 *
 */
public abstract class AbstractFilterSelector<Data> {
	private final ResourceHolder resourceHolder = ResourceHolder.getInstance();

	/**
	 *
	 * @return available filters.
	 */
	protected abstract SortedMap<FileTypeProperty<Data>, FileAccessSupportFilter<Data>> getFilters();

	/**
	 * A utility method for creating filter. This method provides an explanation
	 * text for dialog.
	 *
	 * @param fileTypeKey
	 * @param resourceKey
	 * @return explanation text for dialog.
	 */
	protected String createDescription(final FileTypeProperty<Data> fileTypeKey,
			final String resourceKey) {
		return FileAccessSupportFilter.createDefaultDescription(fileTypeKey,
				resourceHolder.getString(ResourceKey.LABEL, resourceKey));

	}

	/**
	 * Creates and puts a filter for given file type key with given description
	 * to filter map obtained by {@link #getFilters()}.
	 *
	 * @param key
	 * @param desctiption
	 */
	protected void putFilter(final FileTypeProperty<Data> key, final String desctiption) {
		this.putFilter(key, new FileAccessSupportFilter<Data>(key, desctiption));
	}

	/**
	 *
	 * @param key
	 *            A value that describes the file type you want.
	 * @return A filter for given key.
	 */
	public FileAccessSupportFilter<Data> getFilter(final FileTypeProperty<Data> key) {
		return getFilters().get(key);
	}

	/**
	 *
	 * @param key
	 *            A value that describes the file type you want.
	 * @param filter
	 *            A filter to be set.
	 * @return The previous filter for given key.
	 */

	public FileAccessSupportFilter<Data> putFilter(final FileTypeProperty<Data> key,
			final FileAccessSupportFilter<Data> filter) {
		return getFilters().put(key, filter);
	}

	/**
	 *
	 * @return all filters in this instance.
	 */
	public FileAccessSupportFilter<Data>[] toArray() {
		@SuppressWarnings("unchecked")
		FileAccessSupportFilter<Data>[] array = new FileAccessSupportFilter[getFilters()
				.size()];

		return getFilters().values().toArray(array);
	}

	/**
	 *
	 * @return filters that can load data from a file.
	 */
	public FileAccessSupportFilter<Data>[] getLoadables() {
		var loadables = getFilters().values().stream()
				.filter(f -> f.getLoadingAction() != null)
				.collect(Collectors.toList());

		var multi = new MultiTypeAcceptableFileLoadingFilter<Data>(
				loadables, "Any type");
		loadables.add(multi);

		Collections.sort(loadables);

		@SuppressWarnings("unchecked")
		FileAccessSupportFilter<Data>[] array = new FileAccessSupportFilter[loadables
				.size()];

		return loadables.toArray(array);
	}

	/**
	 * @param path
	 * @return a filter that can load the file at the path.
	 * @throws IllegalArgumentException
	 *             No filter is available for the given path. Or, the path is
	 *             null or is for a directory.
	 */
	public FileAccessSupportFilter<Data> getLoadableFilterOf(final String path)
			throws IllegalArgumentException {
		if (path == null) {
			throw new IllegalArgumentException("Wrong path (null)");
		}

		File file = new File(path);
		if (file.isDirectory()) {
			throw new IllegalArgumentException("The path is for directory.");
		}

		return Stream.of(toArray())
				.filter(f -> f.accept(file) && f.getLoadingAction() != null)
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException(
						"cannot load the file with the extension."));
	}

	/**
	 *
	 * @return filters that can save a data object.
	 */
	@SuppressWarnings("unchecked")
	public FileAccessSupportFilter<Data>[] getSavables() {
		var savables = getFilters().values().stream()
				.filter(f -> f.getSavingAction() != null)
				.collect(Collectors.toList());

		Collections.sort(savables);

		return (FileAccessSupportFilter<Data>[]) savables
				.toArray(new FileAccessSupportFilter<?>[savables.size()]);
	}

}