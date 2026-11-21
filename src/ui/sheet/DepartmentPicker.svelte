<script lang="ts">
  import type { DepartmentId } from '../../shared/types';
  import { DEPARTMENTS, getDepartment } from '../../shared/departments';

  let { department = $bindable() }: { department: DepartmentId } = $props();

  /** The department list is long, so only the chosen one shows until the user asks to change it. */
  let expanded = $state(false);
  const current = $derived(getDepartment(department));

  function pick(id: DepartmentId) {
    department = id;
    expanded = false;
  }
</script>

{#if expanded}
  <div class="departments">
    {#each DEPARTMENTS as option (option.id)}
      <button type="button" class="department" style:--c={option.color} aria-pressed={option.id === department} onclick={() => pick(option.id)}>
        <i></i>{option.name}
      </button>
    {/each}
  </div>
{:else}
  <button type="button" class="department selected" style:--c={current.color} onclick={() => (expanded = true)} aria-expanded="false">
    <i></i>{current.name}
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
  </button>
{/if}

<style>
  .departments {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .department {
    height: 40px;
    padding: 0 14px 0 12px;
    border-radius: 999px;
    border: 1.5px solid var(--line);
    background: var(--card);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    transition: background 0.2s, border-color 0.2s;
  }
  .department i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c);
    flex: none;
  }
  .department.selected,
  .department[aria-pressed='true'] {
    border-color: var(--c);
    background: color-mix(in srgb, var(--c) 15%, var(--card));
  }
  .department.selected svg {
    width: 16px;
    height: 16px;
    margin-left: 2px;
    fill: none;
    stroke: var(--mut);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
