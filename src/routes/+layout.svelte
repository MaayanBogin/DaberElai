<script lang="ts">
	import favicon from '$lib/assets/mic.png';
	import theme from '$lib/theme';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<style>
  /* These styles will apply to your ENTIRE application */
  :root {
    /* Light Mode Variables */
    --bg-color: #f9fafb;
    --text-primary: #111827;
    --text-secondary: #6b7280;
    --accent-color: #4f46e5;
    --accent-hover: #4338ca;
    --card-bg: #ffffff;
    --border-color: #e5e7eb;
    --sidebar-bg: #ffffff;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    --danger-color: #dc2626;
    --danger-hover: #b91c1c;
    --success-color: #059669;
    --warning-color: #f59e0b;
  }

  /* When the <html> element has the 'dark' class, these variables will be used instead */
  :global(html.dark) {
    /* Dark Mode Variables */
    --bg-color: #111827;
    --text-primary: #f9fafb;
    --text-secondary: #9ca3af;
    --card-bg: #1f2937;
    --border-color: #374151;
    --sidebar-bg: #1f2937;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: var(--bg-color);
    color: var(--text-primary);
    margin: 0;
    padding: 0;
    transition: background-color 0.3s ease, color 0.3s ease;
  }
</style>