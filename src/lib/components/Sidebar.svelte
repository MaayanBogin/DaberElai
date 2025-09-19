<!-- src/lib/components/Sidebar.svelte -->
<script lang="ts">
    export let sidebarItems;
    export let activeTab;
    export let switchTab;
    export let userTokens;
</script>

<aside class="sidebar">
	<div class="sidebar-header">
		<a href="/" class="logo">Daber Elai</a>
		<div class="labs-badge">Labs</div>
	</div>
	
	<!-- Simple vertical tabs -->
	<nav class="tab-nav">
		{#each sidebarItems as item}
			<button 
				class="tab-item" 
				class:active={activeTab === item.id}
				on:click={() => switchTab(item.id)}
			>
				{item.label}
			</button>
		{/each}
	</nav>
	
	<div class="sidebar-footer">
		<div class="token-info">
			<span class="token-label">Tokens</span>
			<span class="token-count">{userTokens}</span>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		width: 240px;
		background: var(--sidebar-bg);
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		text-decoration: none;
	}

	.labs-badge {
		background: var(--accent-color);
		color: white;
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	/* Simple Tab Navigation */
	.tab-nav {
		flex: 1;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.tab-item {
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		text-align: left;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		border-radius: 6px;
	}

	.tab-item:hover {
		background: color-mix(in srgb, var(--accent-color) 8%, transparent);
		color: var(--text-primary);
	}

	.tab-item.active {
		background: color-mix(in srgb, var(--accent-color) 15%, transparent);
		color: var(--accent-color);
		font-weight: 600;
	}

	.sidebar-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	.token-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.token-label {
		color: var(--text-secondary);
	}

	.token-count {
		font-weight: 600;
		color: var(--text-primary);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.sidebar {
			width: 100%;
			height: auto;
		}

		.tab-nav {
			flex-direction: row;
			padding: 1rem;
			overflow-x: auto;
			gap: 0.5rem;
		}

		.tab-item {
			white-space: nowrap;
			flex-shrink: 0;
		}
	}
</style>