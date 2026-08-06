// Build configuration consumed by `mercato-modules module build|dev` for this
// package. Only packages with special build needs ship this file.
export default {
  build: {
    // Integration fixtures are not part of the shipped runtime.
    extraIgnore: ['**/__integration__/**'],
  },
}
