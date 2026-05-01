<script lang="ts">
  interface Props {
    size?: "sm"|"md"|"lg";
    /** Accessible label (read by screen readers). */
    label?: string;
  }

  const { size = "md", label = "Loading" }: Props = $props();

  const PX: Record<string, string> = { sm: "12px", md: "18px", lg: "28px" };
</script>

<span
  class="spinner"
  role="status"
  aria-label={label}
  style="--size: {PX[size]};"
>
  <span class="sr-only">{label}</span>
</span>

<style>
.spinner {
  display: inline-block;
  width:  var(--size);
  height: var(--size);
  border: 2px solid var(--color-border-subtle);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
