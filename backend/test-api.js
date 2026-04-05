const performTests = async () => {
  try {
    console.log("=== Testing Backend APIs ===");

    // 1. Register User
    console.log("\\n1. Registering new test user...");
    const regRes = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test" + Date.now() + "@example.com",
        password: "password123",
        role: "STUDENT"
      })
    });
    const regData = await regRes.json();
    console.log(regRes.status === 201 ? "✅ Registration successful" : "❌ Registration failed", regData);
    
    if (!regData.token) return;
    const token = regData.token;

    // 2. Create Issue
    console.log("\\n2. Creating issue...");
    const issueRes = await fetch("http://localhost:5000/api/issues/create", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({
        title: "Test Issue",
        description: "Testing API",
        category: "Other",
        location: "Test Location",
        priority: "Low"
      })
    });
    const issueData = await issueRes.json();
    console.log(issueRes.status === 201 ? "✅ Issue created" : "❌ Issue creation failed", issueData.title);

    const issueId = issueData._id;

    // 3. Get Issues
    console.log("\\n3. Getting all issues...");
    const getRes = await fetch("http://localhost:5000/api/issues/all", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const getData = await getRes.json();
    console.log(getRes.status === 200 ? `✅ Retrieved ${getData.length} issues` : "❌ Retrieval failed");

    // 4. Vote on Issue
    console.log("\\n4. Voting on issue...");
    const voteRes = await fetch(`http://localhost:5000/api/issues/${issueId}/vote`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const voteData = await voteRes.json();
    console.log(voteRes.status === 200 ? "✅ Voted successfully" : "❌ Voting failed", "Votes:", voteData.votes?.length);

    console.log("\\n=== All Tests Finished ===");
  } catch (err) {
    console.error("Test Error:", err.message);
  }
};

performTests();
