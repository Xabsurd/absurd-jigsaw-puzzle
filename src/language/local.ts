import zh from './cn.json';
export type MessageSchema = typeof zh;
let local:MessageSchema;
const urlParams = new URLSearchParams(window.location.search);
const curLanguage = urlParams.get('language') || 'zh';
export default async function getLocal() {
  if (!local) {
    switch (curLanguage) {
      case 'en-US':
        local = (await import('./en.json')).default;
        break;
      default:
        local = zh;
        break;
    }
  }
  return local;
}
