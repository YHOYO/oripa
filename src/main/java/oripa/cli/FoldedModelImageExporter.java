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
package oripa.cli;

import java.awt.Color;
import java.util.List;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import oripa.persistence.entity.FoldedModelEntity;
import oripa.persistence.entity.exporter.FoldedModelExporterSVG;
import oripa.persistence.entity.exporter.FoldedModelPictureConfig;
import oripa.persistence.entity.exporter.FoldedModelPictureExporter;
import oripa.persistence.entity.loader.FoldedModelLoaderFOLD;

/**
 * @author OUCHI Koji
 *
 */
public class FoldedModelImageExporter {
	private static final Logger logger = LoggerFactory.getLogger(FoldedModelImageExporter.class);

	static final String SVG_EXTENSION = ".svg";
	static final String JPG_EXTENSION = ".jpg";
	static final String PNG_EXTENSION = ".png";

	static final List<String> AVAILABLE_EXTENSIONS = List.of(SVG_EXTENSION, JPG_EXTENSION, PNG_EXTENSION);

	public void export(final String inputFilePath, final int index, final boolean reverse,
			final String outputFilePath, final double eps) {

		final var lowerInputFilePath = inputFilePath.toLowerCase();
		final var lowerOutputFilePath = outputFilePath.toLowerCase();

		if (!lowerInputFilePath.endsWith(".fold")) {
			throw new IllegalArgumentException("Input format is not supported. acceptable format: fold");
		}

		if (AVAILABLE_EXTENSIONS.stream().noneMatch(lowerOutputFilePath::endsWith)) {
			throw new IllegalArgumentException("Output format is not supported. acceptable format: "
					+ String.join(",", AVAILABLE_EXTENSIONS));
		}

		var inputFileLoader = new FoldedModelLoaderFOLD();

		var regex = Pattern.compile("[.][\\w]+$");
		var matcher = regex.matcher(lowerOutputFilePath);
		if (!matcher.find()) {
			throw new RuntimeException("Wrong implementation.");
		}
		var outputExtension = matcher.toMatchResult().group();

		var outputFileExporter = switch (outputExtension) {
		case (SVG_EXTENSION) -> new FoldedModelExporterSVG(reverse);
		default -> new FoldedModelPictureExporter();
		};

		try {
			var inputModelEntityOpt = inputFileLoader.load(inputFilePath);

			var entity = new FoldedModelEntity(inputModelEntityOpt.orElseThrow().toFoldedModel(), index);

			Object config = switch (outputExtension) {
			case (SVG_EXTENSION) -> null;
			default -> new FoldedModelPictureConfig()
					.setAmbientOcclusion(false)
					.setColors(Color.GRAY.brighter(), Color.WHITE)
					.setDrawEdges(true)
					.setFaceOrderFlipped(reverse)
					.setFillFaces(true)
					.setEps(eps);
			};
			outputFileExporter.export(entity, outputFilePath, config);

		} catch (Exception e) {
			logger.error("image error", e);
		}
	}
}
