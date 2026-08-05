<script setup lang="ts">
/**
 * Staff Play — same chat layout as public /play:
 * scrollable output + fixed prompt below.
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
    class="play-client play-client--chat"
  >
    <header class="play-client__bar">
      <div class="play-client__bar-text">
        <p class="muted dash-kicker">
          Game
        </p>
        <h1 class="page-title play-client__title">
          Play
          <span
            class="muted play-client__status"
            :data-status="status"
          >({{ status }})</span>
        </h1>
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
      class="play-client__error"
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
          : 'No output yet — type a command below.'"
      />
    </div>

    <form
      class="play-client__prompt"
      @submit="onSubmit"
    >
      <span
        class="play-client__gt muted"
        aria-hidden="true"
      >&gt;</span>
      <label class="play-client__label">
        <span class="visually-hidden">Command</span>
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
