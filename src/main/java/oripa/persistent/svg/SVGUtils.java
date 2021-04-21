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

package oripa.persistent.svg;

import javax.vecmath.Vector2d;
import java.util.List;

/**
 * @author OUCHI Koji / BETTINELLI Jean-Noel
 */
public class SVGUtils {
    private SVGUtils() {
    }

    public static final int SVG_SIZE = 1000;
    public static final double SVG_HALF_SIZE = (double) SVG_SIZE / 2;

    public static final String SVG_XML_HEADER = "<?xml version=\"1.0\" encoding=\"ISO-8859-1\" standalone=\"no\"?>\n"
            + "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 20010904//EN\"\n"
            + "\"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">\n";

    public static final String SVG_START_TAG = "<svg xmlns=\"http://www.w3.org/2000/svg\"\n"
            + " xmlns:xlink=\"http://www.w3.org/1999/xlink\" xml:space=\"preserve\"\n"
            + " width=\"" + SVG_SIZE + "px\" height=\"" + SVG_SIZE + "px\"\n"
            + " viewBox=\"0 0 " + SVG_SIZE + " " + SVG_SIZE + "\" >\n";

    public static final String SVG_START = SVG_XML_HEADER + SVG_START_TAG;

    public static final String SVG_END_TAG = "</svg>";

    /**
     * FoldedModelExporterSVG styles
     */
    public static final String GRADIENT_FRONT = "<linearGradient id=\"Gradient1\"" +
            " x1=\"20%\" y1=\"0%\" x2=\"80%\" y2=\"100%\">\n" +
            "    <stop offset=\"5%\" stop-color=\"#DDEEFF\" />\n" +
            "    <stop offset=\"95%\" stop-color=\"#7788FF\" />\n" +
            "</linearGradient>\n";

    public static final String GRADIENT_BACK = "<linearGradient id=\"Gradient2\"" +
            " x1=\"20%\" y1=\"0%\" x2=\"80%\" y2=\"100%\">\n" +
            "    <stop offset=\"5%\" stop-color=\"#FFFFEE\" />\n" +
            "    <stop offset=\"95%\" stop-color=\"#DDDDDD\" />\n" +
            "</linearGradient>\n";

    public static final String GRADIENTS_DEFINITION = GRADIENT_FRONT + GRADIENT_BACK;

    public static final String PATH_STYLE_FRONT = "style=\"" +
            "fill:url(#Gradient1);" +
            "stroke:#0000ff;" +
            "stroke-width:2px;" +
            "stroke-linecap:butt;" +
            "stroke-linejoin:miter;" +
            "stroke-opacity:1;" +
            "fill-opacity:1.0\"\n ";

    public static final String PATH_STYLE_BACK = "style=\"" +
            "fill:url(#Gradient2);" +
            "stroke:#0000ff;" +
            "stroke-width:2px;" +
            "stroke-linecap:butt;" +
            "stroke-linejoin:miter;" +
            "stroke-opacity:1;" +
            "fill-opacity:1.0\"\n ";

    public static final String THICK_LINE_STYLE = "style=\"" +
            "stroke:black;" +
            "stroke-width:2px;" +
            "\"";

    /**
     * OrigamiModelExporterSVG styles
     */
    public static final String PATH_STYLE_TRANSLUCENT = "style=\"" +
            "fill:black;" +
            "fill-opacity:0.04;" +
            "stroke:black;" +
            "stroke-width:0.25px;" +
            "stroke-linecap:butt;" +
            "stroke-linejoin:miter;" +
            "stroke-opacity:1\"\n ";

    public static final String THIN_LINE_STYLE = "style=\"" +
            "stroke:black;" +
            "stroke-width:0.25px;" +
            "\"";

    public static StringBuilder getLineTag(Vector2d startPoint, Vector2d endPoint, String style) {
        StringBuilder builder = new StringBuilder();

        //@formatter:off
        builder.append("<line ")
                    .append("x1=\"").append(startPoint.x).append("\" ")
                    .append("y1=\"").append(startPoint.y).append("\" ")
                    .append("x2=\"").append(endPoint.x).append("\" ")
                    .append("y2=\"").append(endPoint.y).append("\" ")
                    .append(style)
                .append("/>\n");
        //@formatter:on
        return builder;
    }

    public static void putInGroup(StringBuilder groupContent) {
        groupContent.insert(0, ("<g>"))
                .append("</g>");
    }

    public static StringBuilder getPathTag(List<Vector2d> points, String style) {
        StringBuilder pathBuilder = new StringBuilder();
        pathBuilder.append("<path ");
        pathBuilder.append(style);
        pathBuilder.append(" d=\"M ");

        points.forEach(point -> pathBuilder.append(point.x).append(",").append(point.y).append(" "));

        pathBuilder.append(" z\" />\n");

        return pathBuilder;
    }
}
