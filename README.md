
Built by https://www.blackbox.ai

---

```markdown
# Goteco - Shower Water Monitor

## Project Overview
Goteco is a web-based application designed to help users monitor and track their shower water usage in real-time. The application provides insights into water consumption, alerts for exceeding daily limits, and AI-driven recommendations for conservation and efficiency improvements.

## Installation
To set up the project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/goteco.git
   cd goteco
   ```

2. **Open the project in your preferred web browser.**
   Simply open the `index.html` file in a web browser to run the application.

## Usage
Once the application is loaded in the browser, you can interact with it as follows:

1. **Start a shower session** by clicking the "Start" button. The application will track your time and water usage.
2. **Stop the session** by clicking the "Stop" button. Your session data will be saved automatically.
3. **Reset daily usage data** by clicking the reset button, accessible from the Daily Limit section.
4. Access the **Settings** page to customize your water usage limits, alert preferences, and AI features.
5. View your **Monthly Summary** for detailed insights on your water usage trends and predictions.

## Features
- **Real-time Monitoring:** Track water usage and estimated costs during each shower session.
- **AI-Driven Insights:** Receive predictions and recommendations for water conservation based on usage patterns.
- **Customizable Alerts:** Set alert preferences for exceeding daily water limits.
- **Daily and Monthly Summaries:** View graphical representations of water usage for better insights.
- **City Configurations:** Select different cities with custom parameters for water usage.

## Dependencies
This project utilizes the following libraries:
- **Tailwind CSS** (for styling)
- **Chart.js** (for graphing and charting)
- **FullCalendar** (for usage visualization in calendar format)

You can load these libraries directly from the CDN as they are included in the HTML files.

## Project Structure
The project is organized into the following structure:
```
/goteco
|-- index.html               # Main application entry point
|-- settings.html            # User settings for configuring app parameters
|-- monthly-summary.html      # Monthly summary report page
|-- script.js                 # Main JavaScript functionality
|-- style.css                 # Custom styles
|-- translations.js           # Multi-language support
|-- reset_button_styles.css    # Reset button styling
|-- several backup HTML files   # Backup versions of the application pages
```

### Files Explained
- **`index.html`**: The main dashboard where users start and stop their shower sessions.
- **`settings.html`**: A page for the user to customize their app settings and preferences.
- **`monthly-summary.html`**: Displays a comprehensive overview of water usage over the month.
- **`script.js`**: Contains all JavaScript logic, including session tracking and AI predictions.
- **`style.css`**: Provides additional styling to complement Tailwind CSS.
- **`translations.js`**: Holds translations for multi-language support.

## Contribution
If you would like to contribute to this project, feel free to open an issue or submit a pull request. Contributions are welcome!

## License
This project is licensed under the [MIT License](LICENSE).
```