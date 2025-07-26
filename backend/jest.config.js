require('dotenv').config({ path: __dirname + '/.env.test' });

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: [],
}; 