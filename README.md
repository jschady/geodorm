<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">


# GEODORM

<em>Seamless Location Control for Smarter Communities</em>

<!-- BADGES -->
<img src="https://img.shields.io/github/license/jschady/geodorm?style=flat&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="license">
<img src="https://img.shields.io/github/last-commit/jschady/geodorm?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/jschady/geodorm?style=flat&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/jschady/geodorm?style=flat&color=0080ff" alt="repo-language-count">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/Markdown-000000.svg?style=flat&logo=Markdown&logoColor=white" alt="Markdown">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/Autoprefixer-DD3735.svg?style=flat&logo=Autoprefixer&logoColor=white" alt="Autoprefixer">
<img src="https://img.shields.io/badge/PostCSS-DD3A0A.svg?style=flat&logo=PostCSS&logoColor=white" alt="PostCSS">
<br>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/ESLint-4B32C3.svg?style=flat&logo=ESLint&logoColor=white" alt="ESLint">
<img src="https://img.shields.io/badge/YAML-CB171E.svg?style=flat&logo=YAML&logoColor=white" alt="YAML">

</div>
<br>

---

## Overview

geodorm is an open-source developer toolset for building real-time, location-aware web applications with advanced geofence management, offline capabilities, and secure user authentication. It leverages modern frameworks like Next.js and Supabase to deliver a scalable, maintainable architecture.

**Why geodorm?**

This project streamlines the development of spatially aware apps by providing:

- 🧭 **Real-time Status Tracking:** Seamlessly monitor user presence and device locations with instant updates.
- 🛡️ **Secure Authentication & Authorization:** Route-based middleware ensures safe access control.
- 🌐 **Progressive Web App Support:** Offline functionality and optimized asset delivery for a smooth user experience.
- 🎯 **Robust Geofence Management:** Create, edit, share, and manage geofences with real-time collaboration.
- 🔧 **Modular Serverless Architecture:** Server actions replace traditional API routes for improved performance and maintainability.
- 📦 **Type-Safe Development Environment:** Consistent, reliable builds with TypeScript and dependency lockfiles.

---

## OverlandGPS Integration

To enable automatic location tracking, GeoDorm integrates with the OverlandGPS mobile application. This third-party app sends location data from a user's device to the GeoDorm server, which then updates the user's status within their geofences.

**How It Works**

1. **Device Registration**: Each user must register their device's unique ID from the OverlandGPS app within the GeoDorm dashboard. This is a one-time setup.
2. **Location Updates**: The OverlandGPS app periodically sends the device's location to a secure endpoint in the GeoDorm application (/api/location-update).
3. **Status Determination**: The GeoDorm server processes this location data, determines if the user is inside or outside any of their geofences, and updates their status accordingly.

**Setup Instructions**

1. **Install Overland**: Download and install the Overland application on your mobile device.
2. **Find Your Device ID**:
- Open the Overland app.
- Go to Settings.
- Click on Server URL.
- Create a Device ID.
3. **Register in GeoDorm**:
- Log in to your GeoDorm dashboard.
- Navigate to the "GPS Device" management card.
- Click "Register Device" and paste the Device ID you created from the Overland app.
4. **Configure OverlandGPS**:
- In the OverlandGPS app settings, set the Endpoint URL to point to https://geodorm.vercel.app/api/location-update.
- Set "Tracking Enabled" to "On"
- Set "Continuous Tracking Mode" to "Standard"
- Set "Desired" Accuracy" to "10m"
- Set "Logging Mode" to "Only Latest"
- Set "Min Time Between Points" to "1s"
- Finally on the Tracker page configure the "Send Interval" to 10 minutes

Once configured, the OverlandGPS app will automatically send location updates in the background, and your status in GeoDorm will update in real-time based on your location.

---

<div align="left"><a href="#top">⬆ Return</a></div>

---
