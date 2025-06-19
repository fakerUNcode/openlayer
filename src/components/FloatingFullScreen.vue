<template>
  <div class="floating-fullscreen">
    <button @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '进入全屏'" class="fullscreen-button">
      <span v-if="!isFullscreen">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
        </svg>
      </span>
      <span v-else>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
        </svg>
      </span>
    </button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'FloatingFullScreen',
  props: {
    map: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const isFullscreen = ref(false)

    const toggleFullscreen = () => {
      const mapTarget = props.map.getTargetElement()
      
      if (!isFullscreen.value) {
        if (mapTarget.requestFullscreen) {
          mapTarget.requestFullscreen()
        } else if (mapTarget.webkitRequestFullscreen) {
          mapTarget.webkitRequestFullscreen()
        } else if (mapTarget.msRequestFullscreen) {
          mapTarget.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen()
        }
      }
    }

    const handleFullscreenChange = () => {
      isFullscreen.value = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      )
    }

    onMounted(() => {
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.addEventListener('msfullscreenchange', handleFullscreenChange)
    })

    onUnmounted(() => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    })

    return {
      isFullscreen,
      toggleFullscreen
    }
  }
}
</script>

<style scoped>
.floating-fullscreen {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.fullscreen-button {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.fullscreen-button:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.fullscreen-button svg {
  width: 20px;
  height: 20px;
  color: #333;
}
</style>