#!/usr/bin/env node
/**
 * Verify Feishu configuration is correct
 */

import fs from "node:fs"
import path from "node:path"
import os from "os"

console.log("🔍 Verifying Feishu Configuration...\n")

const configDir = path.join(
  process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"),
  "opencode"
)
const configFile = path.join(configDir, "feishu-notifier.json")

// Check if config file exists
if (!fs.existsSync(configFile)) {
  console.error(`❌ Config file not found: ${configFile}`)
  console.log("\n📝 Create it with:")
  console.log(`cat > ${configFile} << 'EOF'`)
  console.log(JSON.stringify({
    appId: "cli_xxxxx",
    appSecret: "your_app_secret",
    receiverType: "user_id",
    receiverId: "your_user_id"
  }, null, 2))
  console.log("EOF")
  process.exit(1)
}

console.log(`✓ Config file exists: ${configFile}\n`)

// Read and parse config
let config
try {
  const raw = fs.readFileSync(configFile, "utf8")
  config = JSON.parse(raw)
  console.log("✓ Config file is valid JSON\n")
} catch (error) {
  console.error(`❌ Failed to parse config: ${error.message}`)
  process.exit(1)
}

// Check structure
console.log("📋 Config structure check:")

// Check if incorrectly nested
if (config.feishuNotifier) {
  console.error("❌ Config is nested under 'feishuNotifier' key")
  console.log("   Expected top-level fields: appId, appSecret, receiverType, receiverId")
  console.log("   Found: { feishuNotifier: { ... } }")
  console.log("\n🔧 Fix with:")
  console.log(`cat > ${configFile} << 'EOF'`)
  console.log(JSON.stringify(config.feishuNotifier, null, 2))
  console.log("EOF")
  process.exit(1)
}

console.log("  ✓ No incorrect nesting\n")

// Validate required fields
const required = ["appId", "appSecret", "receiverType", "receiverId"]
const missing = []

for (const field of required) {
  if (config[field]) {
    console.log(`  ✓ ${field}: ${maskValue(field, config[field])}`)
  } else {
    missing.push(field)
    console.log(`  ✗ ${field}: missing`)
  }
}

console.log()

if (missing.length > 0) {
  console.error(`❌ Missing required fields: ${missing.join(", ")}`)
  console.log("\n📝 Complete config example:")
  console.log(JSON.stringify({
    appId: config.appId || "cli_xxxxx",
    appSecret: config.appSecret || "your_app_secret",
    receiverType: config.receiverType || "user_id",
    receiverId: config.receiverId || "your_user_id"
  }, null, 2))
  process.exit(1)
}

validatePlaceholder("appId", config.appId)
validatePlaceholder("appSecret", config.appSecret)

// Validate receiverType
const validTypes = ["user_id", "open_id", "chat_id"]
if (!validTypes.includes(config.receiverType)) {
  console.error(`❌ Invalid receiverType: ${config.receiverType}`)
  console.log(`   Valid values: ${validTypes.join(", ")}`)
  process.exit(1)
}

console.log(`✓ receiverType is valid: ${config.receiverType}\n`)

console.log("✅ Configuration is valid!\n")

console.log("📊 Summary:")
console.log(`  App ID: ${maskValue("appId", config.appId)}`)
console.log(`  App Secret: ${maskValue("appSecret", config.appSecret)}`)
console.log(`  Receiver Type: ${config.receiverType}`)
console.log(`  Receiver ID: ${maskValue("receiverId", config.receiverId)}`)

console.log("\n🎯 Next step:")
console.log("  Restart OpenCode to load the configuration")
console.log("  Expected log: 'Loaded Feishu config'")

function validatePlaceholder(field, value) {
  const placeholderMatch = value.match(/^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/)
  if (!placeholderMatch) {
    return
  }

  const envName = placeholderMatch[1]
  if (!process.env[envName]) {
    console.error(`❌ ${field} uses placeholder ${value}, but env ${envName} is not set`)
    process.exit(1)
  }

  console.log(`✓ ${field} placeholder resolved from env ${envName}`)
}

function maskValue(field, value) {
  const placeholderMatch = value.match(/^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/)
  if (placeholderMatch) {
    return value
  }

  if (field === "appSecret") {
    if (value.length <= 8) {
      return "****"
    }
    return value.slice(0, 4) + "****" + value.slice(-4)
  }

  if (field === "appId" || field === "receiverId") {
    if (value.length <= 8) {
      return value.slice(0, 2) + "****"
    }
    return value.slice(0, 8) + "****"
  }

  return value
}
