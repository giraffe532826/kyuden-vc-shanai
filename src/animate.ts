const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const cancelAnimations = (...els: Array<Element | null | undefined>) => {
  els.forEach((el) => {
    if (!el || !('getAnimations' in el)) return
    ;(el as HTMLElement).getAnimations().forEach((anim) => anim.cancel())
  })
}

const CURTAIN_MS = 1050
const CURTAIN_EASE = 'cubic-bezier(0.7, 0, 0.3, 1)'

const animateHeight = (
  el: HTMLElement,
  from: number,
  to: number,
  duration: number,
  easing = CURTAIN_EASE,
) =>
  new Promise<void>((resolve) => {
    const anim = el.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      {
        duration,
        easing,
        fill: 'forwards',
      },
    )
    anim.onfinish = () => resolve()
  })

const fadeIn = (
  el: HTMLElement,
  duration = 500,
  transformFrom = 'translateY(16px)',
) =>
  el.animate(
    [
      { opacity: 0, transform: transformFrom },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
  ).finished

const prepareStrokeDraw = (paths: SVGPathElement[]) => {
  paths.forEach((path) => {
    path.getAnimations().forEach((anim) => anim.cancel())
    const length = Math.max(path.getTotalLength(), 1)
    path.style.strokeDasharray = `${length}`
    path.style.strokeDashoffset = `${length}`
    path.classList.remove('is-writing', 'is-filled', 'is-drawn')
  })
}

const drawStroke = (path: SVGPathElement | undefined, duration: number) =>
  new Promise<void>((resolve) => {
    if (!path) {
      resolve()
      return
    }
    path.classList.add('is-drawn')
    const from = Number.parseFloat(path.style.strokeDashoffset) || 0
    const anim = path.animate(
      [{ strokeDashoffset: from }, { strokeDashoffset: 0 }],
      { duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
    )
    anim.onfinish = () => resolve()
  })

const drawKachiso = (path: SVGPathElement, duration: number) =>
  new Promise<void>((resolve) => {
    path.classList.add('is-writing')
    const from = Number.parseFloat(path.style.strokeDashoffset) || 0
    const anim = path.animate(
      [{ strokeDashoffset: from }, { strokeDashoffset: 0 }],
      { duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
    )
    anim.onfinish = () => {
      path.classList.add('is-filled')
      resolve()
    }
  })

const patternUnits = (pattern: HTMLElement) =>
  [...pattern.querySelectorAll<SVGGElement>(':scope > svg > g')]

const resetPatternUnits = (pattern: HTMLElement) => {
  patternUnits(pattern).forEach((unit) => {
    unit.getAnimations().forEach((anim) => anim.cancel())
    unit.style.opacity = ''
  })
}

/** ユニットごとにランダムな透明度ゆらぎをループ */
const startPatternShimmer = (
  pattern: HTMLElement,
  stillCurrent: () => boolean,
) => {
  const pulse = (unit: SVGGElement) => {
    if (!stillCurrent()) return
    const from = Number.parseFloat(getComputedStyle(unit).opacity) || 1
    const to = Math.random() < 0.5 ? 0.05 + Math.random() * 0.2 : 0.75 + Math.random() * 0.25
    const duration = 700 + Math.random() * 1100
    const anim = unit.animate([{ opacity: from }, { opacity: to }], {
      duration,
      easing: 'ease-in-out',
      fill: 'forwards',
    })
    anim.onfinish = () => {
      if (!stillCurrent()) return
      unit.style.opacity = String(to)
      pulse(unit)
    }
  }

  patternUnits(pattern).forEach((unit) => {
    const initial = Math.random() < 0.5 ? 0.1 + Math.random() * 0.25 : 0.7 + Math.random() * 0.3
    unit.style.opacity = String(initial)
    window.setTimeout(() => {
      if (!stillCurrent()) return
      pulse(unit)
    }, Math.random() * 600)
  })
}

export type FvElements = {
  header: HTMLElement
  headerInner: HTMLElement
  logo: HTMLElement
  title: HTMLElement
  tagline: HTMLElement
  pattern: HTMLElement
  kachisoPaths: SVGPathElement[]
  strokePaths: SVGPathElement[]
}

let playToken = 0

export async function playFvAnimation(els: FvElements) {
  const token = ++playToken
  const stillCurrent = () => token === playToken

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const headerTarget =
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
    ) || 90

  cancelAnimations(els.header, els.headerInner, els.title, els.tagline, els.pattern)
  resetPatternUnits(els.pattern)

  // reset
  els.header.classList.remove('is-settled')
  els.header.style.height = '100vh'
  els.headerInner.style.opacity = '0'
  els.headerInner.style.transform = ''
  els.logo.classList.remove('is-drawing', 'is-morphed')
  prepareStrokeDraw(els.strokePaths)
  prepareStrokeDraw(els.kachisoPaths)
  els.title.style.opacity = '0'
  els.title.style.transform = ''
  els.tagline.style.opacity = '0'
  els.tagline.style.transform = ''
  els.pattern.style.opacity = '0'

  if (reduced) {
    els.header.style.height = `${headerTarget}px`
    els.header.classList.add('is-settled')
    els.headerInner.style.opacity = '1'
    els.logo.classList.add('is-drawing', 'is-morphed')
    els.strokePaths.forEach((p) => {
      p.style.strokeDashoffset = '0'
      p.classList.add('is-drawn')
    })
    els.title.style.opacity = '1'
    els.title.style.transform = 'none'
    els.tagline.style.opacity = '1'
    els.tagline.style.transform = 'none'
    els.pattern.style.opacity = '0.22'
    els.kachisoPaths.forEach((p) => {
      p.classList.add('is-writing', 'is-filled')
      p.style.strokeDashoffset = '0'
    })
    return
  }

  await wait(220)
  if (!stillCurrent()) return

  // 1) 赤幕上昇 ＋ タイトルが幕下端から同じ速度で所定位置へ
  const viewportH = window.innerHeight
  els.title.style.opacity = '0'
  els.title.style.transform = 'none'
  const titleStartTop = els.title.getBoundingClientRect().top
  const titleFromCurtain = viewportH - titleStartTop

  els.title.style.opacity = '1'
  els.title.style.transform = `translateY(${titleFromCurtain}px)`

  await Promise.all([
    animateHeight(els.header, viewportH, headerTarget, CURTAIN_MS, CURTAIN_EASE),
    els.title.animate(
      [
        { transform: `translateY(${titleFromCurtain}px)`, opacity: 1 },
        { transform: 'translateY(0px)', opacity: 1 },
      ],
      { duration: CURTAIN_MS, easing: CURTAIN_EASE, fill: 'forwards' },
    ).finished,
  ])
  if (!stillCurrent()) return

  els.header.classList.add('is-settled')
  els.header.style.height = ''
  els.header.getAnimations().forEach((anim) => anim.cancel())
  els.title.getAnimations().forEach((anim) => anim.cancel())
  els.title.style.opacity = '1'
  els.title.style.transform = 'none'

  await wait(100)
  if (!stillCurrent()) return

  // 2) thick centerline strokes（タイトル着地後）
  els.logo.classList.add('is-drawing')
  const byKey = (key: string) =>
    els.strokePaths.find((p) => p.dataset.draw === key)

  // X: two diagonals (each as two segments with knockout gap)
  await Promise.all([
    drawStroke(byKey('x-blue-a'), 280),
    wait(40).then(() => drawStroke(byKey('x-blue-b'), 280)),
  ])
  if (!stillCurrent()) return
  await Promise.all([
    drawStroke(byKey('x-orange-a'), 280),
    wait(40).then(() => drawStroke(byKey('x-orange-b'), 280)),
  ])
  if (!stillCurrent()) return

  // V / C / ! together
  await Promise.all([
    drawStroke(byKey('v'), 520),
    wait(100).then(() => drawStroke(byKey('c'), 560)),
    wait(60).then(() => drawStroke(byKey('bang-bar'), 420)),
    wait(260).then(() => drawStroke(byKey('bang-dot'), 160)),
  ])
  if (!stillCurrent()) return

  await wait(160)
  if (!stillCurrent()) return

  // 3) dissolve to detailed logo（ディテール先行・太線遅延のクロスフェード）
  els.logo.classList.add('is-morphed')
  await wait(720)
  if (!stillCurrent()) return

  // 4) かちそー！ — faster
  for (const path of els.kachisoPaths) {
    if (!stillCurrent()) return
    await drawKachiso(path, 180)
    await wait(10)
  }

  await wait(80)
  if (!stillCurrent()) return

  // 5) パターンは非表示のまま先にゆらぎ開始 → 温まってからフェードイン
  startPatternShimmer(els.pattern, stillCurrent)
  await wait(900)
  if (!stillCurrent()) return

  await Promise.all([
    fadeIn(els.headerInner, 650, 'translateY(-6px)'),
    fadeIn(els.tagline, 650, 'translateY(12px)'),
    els.pattern.animate(
      [{ opacity: 0 }, { opacity: 0.22 }],
      { duration: 850, easing: 'ease-out', fill: 'forwards' },
    ).finished,
  ])
}
