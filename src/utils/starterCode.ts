import { Language } from '../types';

export const STARTER_CODES: Record<Language, string> = {
  javascript: `// Example: Inefficient user lookup & data processing
function processUserData(users, targetId) {
  let result = null;
  // Nested loops causing O(n^2) complexity
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (users[i].id === targetId && users[j].parentId === users[i].id) {
        result = users[i];
      }
    }
  }
  
  // Hardcoded secret risk
  const apiKey = "sk_live_9991823719283719283";
  console.log("Processing with key:", apiKey);
  
  // Potential null risk & unhandled exception
  return result.profileData.settings;
}`,
  typescript: `// TypeScript Example: Analytics Aggregator
interface Transaction {
  id: string;
  amount: number;
  category: string;
  status: 'pending' | 'completed' | 'failed';
}

export function calculateTotalRevenue(transactions: Transaction[]): number {
  let total = 0;
  // Sequential loop iteration
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].status === 'completed') {
      total += transactions[i].amount;
    }
  }
  
  // Unsafe eval usage (Security Risk)
  const dynamicMultiplier = eval("1.05");
  return total * dynamicMultiplier;
}`,
  python: `# Python Example: Fibonacci with nested recursion O(2^n)
def recursive_fibonacci(n):
    if n <= 1:
        return n
    return recursive_fibonacci(n - 1) + recursive_fibonacci(n - 2)

def authenticate_user(username, password):
    # Hardcoded credential vulnerability
    if username == "admin" and password == "SecretPassword123!":
        return True
    return False
`,
  java: `public class DataProcessor {
    public int findMaxDuplicate(int[] numbers) {
        int maxDup = -1;
        // O(n^2) nested loop scan
        for (int i = 0; i < numbers.length; i++) {
            for (int j = i + 1; j < numbers.length; j++) {
                if (numbers[i] == numbers[j]) {
                    if (numbers[i] > maxDup) {
                        maxDup = numbers[i];
                    }
                }
            }
        }
        return maxDup;
    }
}`,
  c: `#include <stdio.h>
#include <string.h>

void process_string(char *input) {
    char buffer[16];
    // Potential Buffer Overflow vulnerability (unsafe strcpy)
    strcpy(buffer, input);
    printf("Processed: %s\\n", buffer);
}

int main() {
    process_string("This input string is way too long for the buffer");
    return 0;
}`,
  cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int findElement(const vector<int>& vec, int target) {
    // Linear search O(n)
    for (size_t i = 0; i < vec.size(); ++i) {
        if (vec[i] == target) {
            return i;
        }
    }
    return -1;
}`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Vulnerable Dashboard</title>
</head>
<body>
    <div id="content">
        <!-- Unsafe innerHTML risk pattern in user script -->
        <script>
            const urlParams = new URLSearchParams(window.location.search);
            const userMsg = urlParams.get('msg');
            document.getElementById('content').innerHTML = userMsg;
        </script>
    </div>
</body>
</html>`,
  css: `/* Modern Dashboard Styling */
.dashboard-container {
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #f8fafc;
    padding: 24px;
    font-family: 'Inter', sans-serif;
}

.card {
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s ease;
}`,
  json: `{
  "name": "codepilot-project",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "express": "^4.21.2",
    "react": "^19.0.1"
  },
  "scripts": {
    "start": "node server.js"
  }
}`
};
