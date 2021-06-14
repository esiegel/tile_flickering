import "./App.css";

import { useMemo, useState } from "react";
import {
  BitmapLayer,
  DeckGL,
  COORDINATE_SYSTEM,
  OrthographicView,
  TileLayer,
} from "deck.gl";
import GL from "@luma.gl/constants";
import { ImageLoader } from "@loaders.gl/images";
import { load } from "@loaders.gl/core";

function tileURL(path, z, x, y) {
  const base = process.env.PUBLIC_URL;
  return `${base}${path}/${z}/${x}_${y}.png`;
}

function createTileLayer(paths) {
  // hard code image dimensions
  const imageWidth = 8000;
  const imageHeight = 8000;
  const minDzi = 9;
  const maxDzi = 13;

  return new TileLayer({
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    extent: [0, 0, imageWidth, imageHeight],

    getTileData({ x, y, z }) {
      // early return if out of range.
      // TODO: figure out if we can avoid this bad calls
      if (x < 0 || y < 0) {
        // returning null avoids caching bad tile data
        return null;
      }

      return Promise.all(
        paths.map((path) => {
          return load(tileURL(path, z + maxDzi, x, y), ImageLoader);
        })
      );
    },

    id: `TileLayer-${paths[0]}`,
    maxZoom: 0,
    minZoom: minDzi - maxDzi,

    onTileUnload: (tile) => console.log("UNLOAD", tile),
    onTileError: (error) => console.log("ERROR", error),

    maxRequests: 0,

    renderSubLayers(props) {
      const {
        bbox: { bottom, left, right, top },
      } = props.tile;

      const images = props.data;
      if (images == null) {
        return [];
      }

      const image = images[0];

      // create canvas for manipulation
      const canvas = new OffscreenCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.globalCompositeOperation = "lighter";
      ctx.filter = "opacity(100%)";
      ctx.drawImage(images[0], 0, 0);
      ctx.filter = "opacity(100%)";
      ctx.drawImage(images[1], 0, 0);
      ctx.filter = "opacity(100%)";
      ctx.drawImage(images[2], 0, 0);
      const imageData = ctx.getImageData(0, 0, image.width, image.height);

      // sometimes our tiles are more than 512px?
      const tileWidth = Math.max(512, image.width);
      const tileHeight = Math.max(512, image.height);

      // The left/right/top/bottom values will always be some power of 2.
      // Here we calculate the actual box width/height based on the tile dimension percentages
      const boxWidth = ((right - left) * image.width) / tileWidth;
      const boxHeight = ((bottom - top) * image.height) / tileHeight;

      return new BitmapLayer({
        ...props,
        _imageCoordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        bounds: [left, top + boxHeight, left + boxWidth, top],
        data: null,
        image: imageData,
      });
    },

    tileSize: 512,
  });
}

function App() {
  const [viewState, setViewState] = useState({
    target: [4000, 4000],
    zoom: -4,
  });
  const GL_OPTIONS = { webgl2: true };

  function onViewStateChange(state: { viewState: ViewState }) {
    setViewState(state.viewState);
  }

  const views = useMemo(
    () => [
      new OrthographicView({
        controller: true,
        id: "orth-view",
        rotationDegrees: 0,
        x: 0,
        y: 0,
      }),
    ],
    []
  );

  const layers = [
    createTileLayer([
      "/red_circle/red_circle_files",
      "/blue_circle/blue_circle_files",
      "/yellow_circle/yellow_circle_files",
    ]),
  ];

  return (
    <div className="App">
      <DeckGL
        glOptions={GL_OPTIONS}
        layers={layers}
        onViewStateChange={onViewStateChange}
        views={views}
        viewState={viewState}
      />
    </div>
  );
}

export default App;
