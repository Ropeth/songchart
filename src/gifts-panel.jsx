export default function GiftsPanel ({ artistData, userId }){
  const earningsInPounds = (artistData.pendingEarnings / 100).toFixed(2);
  const threshold = 20;//change to 50 after a month
  const progress = (earningsInPounds / threshold) * 100;
  //TODO: this doesn't update when earnings change or after withdrawal unless you refresh

  const handleSetupPayouts = async () => {
    // Get the URL from your environment variables
    const functionUrl = import.meta.env.VITE_CONNECT_FUNCTION_URL;

    if (!functionUrl || functionUrl.includes("YOUR_CLOUD_FUNCTION_URL")) {
        console.error("Error: The Cloud Function URL is not set in .env.local");
        return;
    }
    //const response = await fetch('YOUR_CLOUD_FUNCTION_URL/createConnectAccount', {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: artistData.email })
    });
    const { url } = await response.json();
    window.location.href = url; // Redirect to Stripe Onboarding
  };

  const handleWithdraw = async () => {
  if (!window.confirm("Ready to transfer your earnings to your bank account?")) return;

  try {
    const response = await fetch(`${import.meta.env.VITE_TRANSFER_FUNCTION_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    const data = await response.json();
    if (data.success) {
      alert("Transfer successful! The funds are on their way to your bank.");
      // You might want to refresh the artist data here to show £0 balance
    } else {
      alert("Transfer failed: " + data.error);
    }
  } catch (err) {
    console.error("Payout error:", err);
  }
};

  return (
    <>
    <div className="artist-earnings">
      <h2>Artist Earnings</h2>
      <p>£{earningsInPounds}</p>
      
      {/* Progress Bar */}
      <div className="progress-outer">
        <div  
        className="progress"
        style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
      
      {!artistData.stripeConnectId ? (
        <button onClick={handleSetupPayouts}>
          Set up Bank Account (Stripe)
        </button>
      ) : (
        <div>
          {earningsInPounds >= threshold ? (
            <button onClick={handleWithdraw}>Withdraw £{earningsInPounds}</button>
          ) : (
            <p>
              Payouts unlock at £{threshold}.00 (Keep dropping those hits!)
            </p>
          )}
        </div>
      )}
    </div>
    </>
  );
};