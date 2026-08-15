# Direct APK Download Folder

Place your compiled Android APK file here as `pro-trader.apk` (i.e. `public/downloads/pro-trader.apk`).

When users click **"Download Android APK"** on your website, it will directly serve `https://your-domain.com/downloads/pro-trader.apk`.

Alternatively, if you host your APK file on GitHub Releases, Cloud Storage (S3, Firebase, R2), or a CDN, set `NEXT_PUBLIC_APK_DOWNLOAD_URL` in your `.env` file to your direct APK download link!
