#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

// Configuration
const LOCAL_PORT = 3000;
const TUNNEL_SUBDOMAIN = 'kwizapp'; // You can change this

console.log('🚀 Starting tunnel for your Next.js app...');

// Check if local server is running
function checkLocalServer() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: LOCAL_PORT,
      path: '/',
      timeout: 2000
    }, (res) => {
      console.log('✅ Local server is running on port 3000');
      resolve();
    });

    req.on('error', () => {
      console.log('❌ Local server not found. Please run "npm run dev" first.');
      reject(new Error('Local server not running'));
    });

    req.on('timeout', () => {
      console.log('❌ Local server not responding. Please run "npm run dev" first.');
      reject(new Error('Local server timeout'));
    });

    req.end();
  });
}

// Create tunnel using localtunnel (free alternative)
async function createTunnel() {
  try {
    // Check if localtunnel is installed
    const localtunnel = require('localtunnel');
    
    console.log(`🔗 Creating tunnel with subdomain: ${TUNNEL_SUBDOMAIN}`);
    
    const tunnel = await localtunnel({
      port: LOCAL_PORT,
      subdomain: TUNNEL_SUBDOMAIN
    });

    console.log(`🌐 Your app is now live at: ${tunnel.url}`);
    console.log('📱 Share this URL to test your app from anywhere!');
    console.log('⚠️  Keep this terminal open to maintain the tunnel.');
    console.log('Press Ctrl+C to stop the tunnel');

    tunnel.on('close', () => {
      console.log('❌ Tunnel closed');
      process.exit(0);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Closing tunnel...');
      tunnel.close();
    });

  } catch (error) {
    console.error('❌ Error creating tunnel:', error.message);
    console.log('\n💡 Installing localtunnel as fallback...');
    
    // Install localtunnel and retry
    const { spawn } = require('child_process');
    const install = spawn('npm', ['install', 'localtunnel'], { stdio: 'inherit' });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ localtunnel installed. Retrying...');
        createTunnel();
      } else {
        console.error('❌ Failed to install localtunnel');
        process.exit(1);
      }
    });
  }
}

// Main execution
async function main() {
  try {
    await checkLocalServer();
    await createTunnel();
  } catch (error) {
    console.error('❌ Failed to start tunnel:', error.message);
    process.exit(1);
  }
}

main();
