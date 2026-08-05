<script setup lang="ts">
/**
 * In-console game client — design.md list/detail chrome + mono output.
 *
 * Plain text → .game-pre with MUSH colors.
 * u.ui.layout → GameLayout (dash-table / headers).
 */
import { nextTick, onMounted, ref, watch } from "vue";
import GameOutput from "@/components/GameOutput.vue";
import { useGameSocket } from "@/composables/useGameSocket";

const {
  messages,
  status,
  error,
  connect,
  disconnect,
  sendCmd,
} = useGameSocket();

const input = ref("");
const scroller = ref<HTMLElement | null>(null);

async function scrollBottom(): Promise<void> {
  await nextTick();
  const el = scroller.value;
  if (el) el.scrollTop = el.scrollHeight;
}

watch(messages, () => {
  void scrollBottom();
});

onMounted(() => {
  void connect();
});

function onSubmit(e: Event): void {
  e.preventDefault();
  const line = input.value;
  input.value = "";
  sendCmd(line);
}

function reconnect(): void {
  disconnect();
  void connect();
}
</script>

<template>
  <article
    id="main-play"
    class="dash-browser play-client"
  >
    <header class="dash-header">
      <div>
        <p class="muted dash-kicker">
          Game
        </p>
        <h1 class="page-title">
          Play
          <span class="muted">
            ({{ status }})
          </span>
        </h1>
        <p class="muted">
          Live world client. Structured layouts when a command
          sends JSON UI; otherwise colored terminal text.
        </p>
      </div>
      <div class="dash-header-actions">
        <button
          type="button"
          class="secondary outline"
          @click="reconnect"
        >
          Reconnect
        </button>
      </div>
    </header>

    <p
      v-if="error"
      class="dash-filter-banner"
      role="alert"
    >
      {{ error }}
    </p>

    <div
      ref="scroller"
      class="play-client__stage"
    >
      <GameOutput
        :messages="messages"
        :empty-hint="status === 'connecting'
          ? 'Connecting to world…'
          : 'No output yet.'"
      />
    </div>

    <form
      class="play-client__prompt pages-toolbar"
      @submit="onSubmit"
    >
      <label class="pages-search-label play-client__label">
        <span class="visually-hidden">Command</span>
        <span
          class="play-client__gt muted"
          aria-hidden="true"
        >&gt;</span>
        <input
          v-model="input"
          type="text"
          name="cmd"
          autocomplete="off"
          spellcheck="false"
          placeholder="look, say hello, +finger …"
          :disabled="status !== 'open'"
        >
      </label>
      <button
        type="submit"
        :disabled="status !== 'open' || !input.trim()"
      >
        Send
      </button>
    </form>
  </article>
</template>
