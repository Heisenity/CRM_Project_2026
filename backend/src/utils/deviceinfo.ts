import { UAParser } from 'ua-parser-js'

export const getDeviceInfo = (userAgent: string) => {
  const parser = new UAParser(userAgent)
  return {
    os: parser.getOS().name || "Unknown",
    browser: parser.getBrowser().name || "Unknown",
    device: parser.getDevice().type || "Unknown"
  }
}