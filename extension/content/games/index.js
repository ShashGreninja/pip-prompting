// The games shown under "Play with Pip". To add one, create a file that
// returns { id, name, blurb, mount(el, api) }, list it in the manifest before
// this file, and add it here. mount() returns a cleanup function.
// api.react(state, ms) lets a game make the real Pip react.
var PipGames = (() => {
  const GAMES = [PipSparkCatch, PipVaguePop, PipPairs];
  return {
    LIST: GAMES.map(({ id, name, blurb }) => ({ id, name, blurb })),
    CSS: PipGameKit.CSS,
    mount: (id, el, api) => GAMES.find(g => g.id === id).mount(el, api)
  };
})();
