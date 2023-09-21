import { init as initEncode } from '@jsquash/png/encode'
import { encode as encodePNG } from '@jsquash/png'
import optimize, { init as initOxiPNG } from '@jsquash/oxipng/optimise'

// on creation, init needed shit
Promise.all([initOxiPNG(), initEncode()]).then(() => {
  // when everything is ready, tell main thread we are initialized
  globalThis.postMessage({})
}).catch(console.error)

// on message, process data
globalThis.onmessage = async (event) => {
  const { input } = event.data

  // encode to png
  let encoded
  try {
    encoded = await encodePNG(input.data)
  }
  catch (error) {
    console.error(`error occurred while encoding ${input.name}, falling back on canvas encode`)
    encoded = await alternateEncodePNG(input.data)
  }

  // optimize with oxi
  let optimized
  try {
    optimized = await optimize(encoded, { optimiseAlpha: true })
  }
  catch (error) {
    console.error(`error occurred while optimizing ${input.name}, falling back on default encode`)
    optimized = encoded
  }

  // take whichever is smaller, oxi result, or encode result
  const outData = optimized.byteLength < encoded.byteLength ? optimized : encoded

  // Send the result back to the main thread
  globalThis.postMessage({ data: { name: input.name, data: outData } })
}
