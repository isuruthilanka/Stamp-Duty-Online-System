# Sequential Procedure for Temporary File Number Generation

This document outlines the systematic procedure for generating temporary file numbers within the Western Province Stamp Duty Digital Platform.

## 1. Overview
Temporary file numbers are assigned to every application upon submission by an external user (Lawyer, Notary, or Financial Institution). These numbers provide a unique reference before a permanent file number is assigned by the Department.

## 2. Numbering Format
The format for temporary file numbers is:
`SD/{CATEGORY}/{YEAR}/{SEQUENCE}`

- **SD**: Prefix for Stamp Duty.
- **CATEGORY**: The application category code:
  - `OP`: Opinion
  - `FI`: Financial
  - `RT`: Rate Tax
- **YEAR**: The current calendar year (e.g., 2026).
- **SEQUENCE**: A 3-digit sequential number, padded with leading zeros (e.g., 001, 002).

## 3. Generation Logic
The system follows a sequential increment logic:

1.  **Filter**: When a new application is initiated, the system retrieves all existing applications matching the same **Category** and **Year**.
2.  **Identify Current Maximum**: The system extracts the sequence number (the last numerical segment) from all matching applications.
3.  **Increment**:
    - If previous applications exist for that category and year, the new sequence number is `Max(Existing Sequences) + 1`.
    - If no previous applications exist (e.g., first application of the year), the sequence starts at `001`.
4.  **Format**: The incremented number is converted to a string and padded with leading zeros to ensure a consistent 3-digit length.

## 4. Implementation Details
The logic is centrally managed in the `AppContext.jsx` within the `generateTempFileNo` function. This ensures that every application submitted through the `addApplication` workflow follows the same strict sequential procedure.
