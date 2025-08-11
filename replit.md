# Hardware Debugger

## Overview

This is a comprehensive hardware debugging application designed for interacting with semiconductor devices, particularly EEPROM/flash memory chips. The application provides a web-based interface for chip identification, serial communication, SPI flash programming, and AI-powered research capabilities. It combines modern web technologies with hardware debugging tools to create a professional-grade development environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using **React 18** with **TypeScript** and **Vite** as the build tool. The application follows a component-based architecture with several key design decisions:

- **UI Framework**: Uses **shadcn/ui** components built on top of **Radix UI** primitives for consistent, accessible interface elements
- **Styling**: **Tailwind CSS** with custom hardware-themed color palette and dark mode support
- **State Management**: **TanStack Query** (React Query) for server state management and caching
- **Routing**: **Wouter** for lightweight client-side routing
- **Form Handling**: **React Hook Form** with **Zod** validation for type-safe form management

The application uses a tabbed interface architecture with five main functional areas: Serial Console, SPI Flasher, Chip Database, AI Research, and Settings. This design separates concerns while maintaining a unified hardware debugging workflow.

### Backend Architecture
The backend is an **Express.js** server with **TypeScript** that provides REST API endpoints and WebSocket communication:

- **API Layer**: RESTful endpoints for chip management, connection history, AI queries, and firmware file operations
- **Real-time Communication**: WebSocket server integration for live hardware communication and status updates
- **Middleware**: Request logging, JSON parsing, and error handling middleware
- **Development Integration**: Vite middleware integration for seamless development experience with HMR support

### Data Storage Solutions
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations:

- **Database Provider**: **Neon Database** (serverless PostgreSQL) for cloud deployment
- **Schema Management**: Drizzle-kit for migrations and schema versioning
- **Type Safety**: Full TypeScript integration between database schema and application code
- **Connection Pooling**: Built-in connection pooling through Neon's serverless driver

The database schema includes tables for users, chips, connection history, AI queries, and firmware files with proper relationships and constraints.

### Hardware Integration
The application integrates with hardware devices through multiple communication protocols:

- **WebSerial API**: For serial communication with debugging devices and microcontrollers
- **WebUSB API**: For direct USB communication with CH341A programmers and similar devices
- **Protocol Support**: SPI flash programming, UART/serial communication, and device detection capabilities

### External Dependencies

- **AI Integration**: OpenAI GPT-4o integration for chip identification and programming assistance
- **UI Components**: Extensive use of Radix UI primitives for accessibility and consistency
- **Development Tools**: Replit-specific plugins for development environment integration
- **Hardware APIs**: WebSerial and WebUSB browser APIs for hardware communication
- **Database**: Neon PostgreSQL for cloud-hosted database services
- **Styling**: Tailwind CSS for utility-first styling approach

The architecture prioritizes type safety, real-time communication, and seamless hardware integration while maintaining a clean separation between frontend presentation, backend logic, and data persistence layers.