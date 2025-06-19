<template>
  <div class="draw-control">
    <button @click="toggleDrawing" :class="{ active: isDrawing }">
      {{ isDrawing ? '取消绘制' : '绘制多边形' }}
    </button>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Draw from 'ol/interaction/Draw';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Fill, Stroke } from 'ol/style';

export default {
  name: 'Duobianxing',
  props: {
    map: {
      type: Object,
      required: true
    }
  },
  emits: ['polygonCreated'],
  setup(props, { emit }) {
    const isDrawing = ref(false);
    const drawInteraction = ref(null);
    const source = new VectorSource();
    const layer = new VectorLayer({
      source: source,
      style: new Style({
        fill: new Fill({
          color: 'rgba(0, 150, 255, 0.3)'
        }),
        stroke: new Stroke({
          color: 'rgba(0, 150, 255, 0.8)',
          width: 2
        })
      })
    });

    onMounted(() => {
      props.map.addLayer(layer);
    });

    onBeforeUnmount(() => {
      props.map.removeLayer(layer);
      deactivateDrawing();
    });

    const toggleDrawing = () => {
      if (isDrawing.value) {
        deactivateDrawing();
      } else {
        activateDrawing();
      }
      isDrawing.value = !isDrawing.value;
    };

    const activateDrawing = () => {
      drawInteraction.value = new Draw({
        source: source,
        type: 'Polygon'
      });

      drawInteraction.value.on('drawend', (event) => {
        emit('polygonCreated', {
          coordinates: event.feature.getGeometry().getCoordinates()[0],
          feature: event.feature
        });
        deactivateDrawing();
        isDrawing.value = false;
      });

      props.map.addInteraction(drawInteraction.value);
    };

    const deactivateDrawing = () => {
      if (drawInteraction.value) {
        props.map.removeInteraction(drawInteraction.value);
        drawInteraction.value = null;
      }
    };

    return {
      isDrawing,
      toggleDrawing
    };
  }
};
</script>

<style scoped>
.draw-control button {
  padding: 8px 16px;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.draw-control button:hover {
  background: linear-gradient(to right, #3aa1e0, #00d1e0);
}

.draw-control button.active {
  background: linear-gradient(to right, #f85032, #e73827);
}
</style>