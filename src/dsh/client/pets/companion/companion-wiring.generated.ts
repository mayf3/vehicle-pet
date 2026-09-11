/**
 * GENERATED FILE — do not edit. Run `node scripts/generate-pet-wiring.mjs`.
 * Wiring for pet 'companion', emitted from pet.json + levels.json +
 * speech.json + scanned asset files only (V8 CTR-038; the data files are
 * the source of truth and this module is tool output).
 */

import { companionAssets, poseAlphaBounds, insigniaAssets, poseAnchors } from '../../character-assets.generated'
import type { PetPresentation } from '../types'

export const companionPresentation: PetPresentation = {
  id: "companion",
  displayName: {"zh-CN":"伙伴","en":"Companion"},
  recipe: "pose-sprite",
  packId: "autonomous-fleet",
  userSelectable: true,
  gradePolicy: {"showExactLevelNumber":false,"showDescription":true,"insigniaMode":"wearable"},
  gradeLevels: [{"id":"l1","zh-CN":"有人驾驶，有保护车","en":"Driver aboard, escort"},{"id":"l2","zh-CN":"有人驾驶，无保护车","en":"Driver aboard, no escort"},{"id":"l3","zh-CN":"副驾安全员，有保护车","en":"Safety copilot + escort"},{"id":"l4","zh-CN":"副驾安全员，无保护车","en":"Safety copilot, no escort"},{"id":"l5","zh-CN":"全无人，一对一远程监管","en":"Unoccupied · Remote 1:1"},{"id":"l6","zh-CN":"一人监管三辆车","en":"One operator · 3 cars"},{"id":"l7","zh-CN":"一人监管十辆车","en":"One operator · 10 cars"},{"id":"l8","zh-CN":"一人监管百辆车","en":"One operator · 100 cars"},{"id":"l9","zh-CN":"千辆车，城市规模","en":"1K cars · City"},{"id":"l10","zh-CN":"万辆车，跨城市","en":"10K cars · Multiple cities"},{"id":"l11","zh-CN":"十万辆车，跨区域","en":"100K cars · Regions"},{"id":"l12","zh-CN":"百万辆车，全球规模","en":"1M cars · Worldwide"}],
  behavior: {"ambientPool":["stretch","yawn","glance-terminal","rest","tidy-cuff","look-around"],"stateReactions":{"completed":"nod","failed":"shy","working":"wave","needs-input":"peek"},"petting":{"variant":"idle-happy","decoration":"heart"}},
  speech: {"idle":[{"id":"companion-idle-1","zh-CN":"我在这儿，陪你慢慢来。","en":"I am here. Take your time."},{"id":"companion-idle-2","zh-CN":"今天也留一点时间给自己。","en":"Save a moment for yourself."},{"id":"companion-idle-3","zh-CN":"安静待一会儿，也很好。","en":"A quiet moment is lovely too."},{"id":"companion-idle-4","zh-CN":"见到你，心情亮了一点。","en":"Seeing you brightens my day."},{"id":"companion-idle-5","zh-CN":"有需要的时候，叫我就好。","en":"Call on me whenever you need."}],"working":[{"id":"companion-working-1","zh-CN":"我先专心一会儿。","en":"Let me focus for a moment."},{"id":"companion-working-2","zh-CN":"正在认真处理呢。","en":"Working on it with care."},{"id":"companion-working-3","zh-CN":"这一会儿，交给我。","en":"Leave this moment with me."},{"id":"companion-working-4","zh-CN":"我还在忙，你可以歇一歇。","en":"Working. Take a breather."},{"id":"companion-working-5","zh-CN":"一点一点，稳稳地来。","en":"One little step at a time."}],"needs-input":[{"id":"companion-needs-input-1","zh-CN":"这里想听听你的选择。","en":"I would like your choice here."},{"id":"companion-needs-input-2","zh-CN":"你来定方向，我等你。","en":"Your direction. I will wait."},{"id":"companion-needs-input-3","zh-CN":"有一处需要你看看。","en":"Something for you to look at."},{"id":"companion-needs-input-4","zh-CN":"准备好了再告诉我。","en":"Tell me when you are ready."},{"id":"companion-needs-input-5","zh-CN":"这一小步，需要你的想法。","en":"Your thoughts on this step?"}],"completed":[{"id":"companion-completed-1","zh-CN":"这一件，做好啦。","en":"This one is done."},{"id":"companion-completed-2","zh-CN":"可以轻轻松口气了。","en":"A little sigh of relief."},{"id":"companion-completed-3","zh-CN":"完成了，给你一个小小的击掌。","en":"All done. High five!"},{"id":"companion-completed-4","zh-CN":"收好这份成果吧。","en":"Keep this little result close."},{"id":"companion-completed-5","zh-CN":"忙完这一段啦。","en":"This part is finished."}],"failed":[{"id":"companion-failed-cancelled-1","zh-CN":"先歇一小会儿。","en":"Let us take a short pause."},{"id":"companion-failed-cancelled-2","zh-CN":"我还在这里。","en":"I am still here."},{"id":"companion-failed-cancelled-3","zh-CN":"等你准备好再继续。","en":"Continue when you are ready."},{"id":"companion-failed-cancelled-4","zh-CN":"慢慢来，不着急。","en":"Take your time. No rush."},{"id":"companion-failed-cancelled-5","zh-CN":"这一段先放一放。","en":"Set this part aside for now."}],"milestone":[{"id":"companion-level-up-1","zh-CN":"我们的旅程又长了一点。","en":"Our journey grew a little."},{"id":"companion-level-up-2","zh-CN":"新的一页，和你一起。","en":"A new page, together with you."},{"id":"companion-level-up-3","zh-CN":"把这一刻好好收起来。","en":"Let us keep this moment."},{"id":"companion-level-up-4","zh-CN":"一路走来，又见到了新的风景。","en":"A new view along the way."},{"id":"companion-level-up-5","zh-CN":"等级牌换新啦，还是熟悉的我。","en":"New badge, same familiar me."}],"petting":[{"id":"companion-petting-1","zh-CN":"嘿嘿，被摸头了。","en":"Ehehe… head pats."},{"id":"companion-petting-2","zh-CN":"再、再摸一下也可以哦。","en":"O-okay, one more pat."},{"id":"companion-petting-3","zh-CN":"袖口都被摸乱啦。","en":"You ruffled my sleeve."}],"welcome":[{"id":"companion-welcome-1","zh-CN":"回来啦。","en":"Welcome back."},{"id":"companion-welcome-2","zh-CN":"又见面啦。","en":"It's you again."},{"id":"companion-welcome-3","zh-CN":"今天也一起吧。","en":"Let's make it a good day."}],"ritual":[{"id":"companion-ritual-1","zh-CN":"第一件事，搞定。","en":"First thing's done."},{"id":"companion-ritual-2","zh-CN":"还没休息呀。","en":"Still up?"},{"id":"companion-ritual-3","zh-CN":"今天也辛苦啦。","en":"You worked hard today."}]},
  license: {"license":"Apache-2.0 (code) / CC-BY-4.0 (assets) — see NOTICE and LICENSE.assets","attribution":"Original character art produced by mayf3 via the Owner-designated offline art route.","provenance":"assets/character-source/PROVENANCE.json"},
  poseSprite: {
    variantPose: {"idle":0,"idle-happy":6,"idle-curious":7,"idle-sleepy":5,"working":2,"needs-input":1,"completed":3,"completed-proud":8,"failed":4,"cancelled":9},
    poses: companionAssets,
    alphaBounds: poseAlphaBounds,
    insignia: {
      mode: 'wearable',
      assets: insigniaAssets,
      anchors: poseAnchors,
    },
  },
}
