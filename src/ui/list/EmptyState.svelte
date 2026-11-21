<div class="empty">
  <svg viewBox="0 -14 160 134" aria-hidden="true">
    <ellipse class="shadow" cx="80" cy="110" rx="52" ry="6" fill="var(--line)" />
    <g class="drop third"><rect x="92" y="18" width="16" height="64" rx="8" transform="rotate(18 100 50)" fill="#d9a55a" /></g>
    <g class="drop first"><circle cx="62" cy="42" r="16" fill="var(--acc)" /><path d="M62 27c3-7 9-9 14-8-2 6-7 9-14 8z" fill="#3e9150" /></g>
    <g class="drop second"><circle cx="86" cy="48" r="13" fill="#3e9150" opacity=".85" /></g>
    <g class="bag">
      <path d="M40 52h80l-8 54a6 6 0 0 1-6 5H54a6 6 0 0 1-6-5z" fill="var(--card)" stroke="var(--line)" stroke-width="2" />
      <path d="M40 52h80l-2 12H42z" fill="var(--soft)" />
    </g>
  </svg>
  <b>Nimekiri on tühi</b>
</div>

<style>
  .empty {
    text-align: center;
    padding: 56px 24px 24px;
    color: var(--mut);
  }
  svg {
    width: 150px;
    height: auto;
    margin-bottom: 14px;
  }
  svg * {
    transform-box: fill-box;
  }
  .bag {
    transform-origin: 50% 100%;
    animation: bag 0.5s var(--ease) both;
  }
  .shadow {
    transform-origin: 50% 50%;
    animation: shadow 0.5s var(--ease) both;
  }
  .drop {
    transform-origin: 50% 100%;
    animation: drop 0.55s cubic-bezier(0.3, 1.5, 0.5, 1) both;
  }
  .first { animation-delay: 0.3s; }
  .second { animation-delay: 0.42s; }
  .third { animation-delay: 0.54s; }
  b {
    display: block;
    color: var(--ink);
    font-size: 19px;
    margin-bottom: 4px;
    animation: rise 0.5s 0.7s var(--ease) both;
  }
  @keyframes bag {
    from { opacity: 0; transform: translateY(14px) scaleY(0.9); }
  }
  @keyframes shadow {
    from { opacity: 0; transform: scaleX(0.5); }
  }
  @keyframes drop {
    0% { opacity: 0; transform: translateY(-46px); }
    60% { opacity: 1; }
  }
  @keyframes rise {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
  }
</style>
