# SWYT: Stop Wasting Your Time

A Chrome web extension to limit the time spent watching YouTube Shorts.

## Usage

In the extension popup, you can choose the duration of the countdown (from 12 seconds to 2 hours!).
Once you start watching a Short, the countdown automatically starts. If you reach its end, you are redirected to a warning page on your next Short. If you change pages, the countdown will pause and resume only when returning to a Shorts page.

The countdown resets at 3 AM every day and you can change the duration of your **next** countdown at any time (if the daily countdown has already begun, it will change the duration for tomorrow's countdown).

### Usage in 5 steps

1. **Start watching Shorts** → Countdown begins automatically
2. **Switch to another page** → Countdown pauses
3. **Return to Shorts** → Countdown resumes
4. **Time limit reached** → Redirected to warning page
5. **Next day at 3 AM** → Countdown resets

## Installation

### [Soon] On Chrome Web Store

Coming Soon...

### With a Git pull

1. Pull the latest version of the project.
2. Execute the command `npm install` to install required components.
3. Execute the build command `npm run build`.
4. Go to the address '**chrome://extensions/** \*/'.
5. Check '**Developer mode**' in the upper right corner.
6. Click on the '**Load unpacked extension**' button in the upper left corner.
7. Select the '**dist**' folder.
8. (Optional) Enjoy!

## Contributing

For **bug reports** or **feature requests**, feel free to open an issue on GitHub [right here](https://github.com/Iryonis/stop-wasting-your-time/issues).

_Please note that this is my first web extension and that English is not my first language._

## License

[GPL-3.0](LICENSE)

## Credits

Created by [Iryon](https://github.com/Iryonis).
Font designed by [Anna Giedryś](https://fonts.google.com/specimen/Signika).
