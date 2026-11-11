import './style.css'
import headerLogo from './assets/header/logo-vc.svg'
import logoStroke from './assets/fv/logo-stroke.svg?raw'
import logoDetail from './assets/fv/logo-detail-clean.svg?raw'
import kachiso from './assets/fv/kachiso-asset.svg?raw'
import patternFigma from './assets/fv/pattern-figma-clean.svg?raw'
import { playFvAnimation } from './animate'

const navItems = [
  { label: 'プロジェクト紹介', href: '#project' },
  { label: 'イノベーションの進め方', href: '#innovation' },
  { label: '学ぶ・調べる', href: '#learn' },
  { label: 'お知らせ・レポート', href: '#news' },
] as const

const app = document.querySelector<HTMLDivElement>('#app')!

const mount = () => {
  app.innerHTML = `
    <div class="fv">
      <header class="site-header" data-node-id="111:10834">
        <div class="site-header__inner">
          <a class="site-header__brand" href="/">
            <img
              class="site-header__logo"
              src="${headerLogo}"
              width="114.505"
              height="40.529"
              alt=""
            />
            <p class="site-header__title">KYUDEN VC CHALLENGE</p>
          </a>
          <nav class="site-header__nav" aria-label="メインナビゲーション">
            <ul class="site-header__nav-list">
              ${navItems
                .map(
                  (item) => `
                <li class="site-header__nav-item">
                  <a class="site-header__nav-link" href="${item.href}">${item.label}</a>
                </li>
              `,
                )
                .join('')}
            </ul>
          </nav>
        </div>
      </header>

      <section class="fv-hero" aria-label="ファーストビュー">
        <div class="fv-pattern" aria-hidden="true">${patternFigma}</div>

        <div class="fv-logo" aria-hidden="true">
          <div class="fv-logo__layer fv-logo__simple">${logoStroke}</div>
          <div class="fv-logo__layer fv-logo__detail">${logoDetail}</div>
          <div class="fv-kachiso">${kachiso}</div>
        </div>

        <h1 class="fv-title">KYUDEN VC CHALLENGE</h1>
        <p class="fv-tagline">「かけあわせ」から生まれる、新しい価値。</p>
      </section>

      <button class="fv-replay" type="button">もう一度再生</button>
    </div>
  `

  const header = app.querySelector<HTMLElement>('.site-header')!
  const headerInner = app.querySelector<HTMLElement>('.site-header__inner')!
  const logo = app.querySelector<HTMLElement>('.fv-logo')!
  const title = app.querySelector<HTMLElement>('.fv-title')!
  const tagline = app.querySelector<HTMLElement>('.fv-tagline')!
  const pattern = app.querySelector<HTMLElement>('.fv-pattern')!
  const kachisoPaths = [
    ...app.querySelectorAll<SVGPathElement>('.fv-kachiso path'),
  ]
  const strokePaths = [
    ...app.querySelectorAll<SVGPathElement>('.fv-logo__simple .draw-stroke'),
  ]
  const replay = app.querySelector<HTMLButtonElement>('.fv-replay')!

  const run = () =>
    playFvAnimation({
      header,
      headerInner,
      logo,
      title,
      tagline,
      pattern,
      kachisoPaths,
      strokePaths,
    })

  replay.addEventListener('click', () => {
    void run()
  })

  void run()
}

mount()
