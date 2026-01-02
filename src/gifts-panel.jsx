export default function GiftsPanel ({ artistData, userId }){
  const earningsInPounds = (artistData.pendingEarnings / 100).toFixed(2);
  const threshold = 50;
  const progress = (earningsInPounds / threshold) * 100;

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
        <button onClick={handleSetupPayouts} className="mt-4 bg-blue-600 text-white p-2 rounded">
          Set up Bank Account (Stripe)
        </button>
      ) : (
        <div>
          {earningsInPounds >= threshold ? (
            <button>Withdraw £{earningsInPounds}</button>
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