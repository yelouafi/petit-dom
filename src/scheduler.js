let effects = [];

export function scheduleEffect(eff) {
  effects.push(eff);
}

export function runEffects() {
  while (effects.length > 0) {
    let currentEffects = effects;
    effects = [];
    currentEffects.forEach((eff) => eff());
  }
}
