// Using pure JS, after page has loaded, load the data from the JSON file
document.addEventListener("DOMContentLoaded", function() {
    // Fetch the JSON data
    fetch('https://raw.githubusercontent.com/tanel/soundmarket/refs/heads/main/msci_emerging_markets_converted.json')
        .then(response => response.json())
        .then(data => {
            window.data = data;
        })
        .catch(error => console.error('Error fetching data:', error));
});

//attach a click listener to a play button
document.addEventListener("click", async () => {
    await Tone.start();
    let data = window.data;
    displayGraph(data);
    playWithTone();
    console.log("audio is ready");
});

const noteDurationList = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64];

function playWithTone() {
    let index = 0;
    const synth = new Tone.MonoSynth().toDestination();

    // Clear previous schedules and stop the transport
    Tone.Transport.stop();
    Tone.Transport.cancel(); // clear previous schedules

    Tone.Transport.scheduleRepeat((time) => {
        if (index >= upcoming.length) {
            Tone.Transport.stop();
            return;
        }

        const price = upcoming[index];
        const high = upcomingHigh[index] - minPrice;
        const durationIndex = Math.floor(Math.log(high)) % noteDurationList.length;
        const noteDuration = noteDurationList[durationIndex];
        console.log(high, durationIndex, noteDuration);

        if (price) {
            let normalizedPrice = price - minPrice;
            const freq = 100 + normalizedPrice;
            const duration = noteDuration + "n";
            synth.triggerAttackRelease(freq, duration , time);
        }

        // update chart
        played[index] = price;
        upcoming[index] = null;
        chart.update();

        index++;
    }, "8n");

    Tone.Transport.start();
}

let chart, played = [], upcoming = [], upcomingHigh = [], labels = [], minPrice, maxPrice;

function displayGraph(data) {
    labels = data.map(r => r.Date).reverse();
    upcoming = data.map(r => parseFloat(r.Price.replace(",", ""))).reverse();
    upcomingHigh = data.map(r => parseFloat(r.High.replace(",", ""))).reverse();
    played = new Array(upcoming.length).fill(null);

    minPrice = Math.min(...upcoming);
    maxPrice = Math.max(...upcoming);

    const ctx = document.getElementById("chart").getContext("2d");

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Played",
                    data: played,
                    borderColor: "red",
                    borderWidth: 2,
                    tension: 0.2
                },
                {
                    label: "Upcoming",
                    data: upcoming,
                    borderColor: "gray",
                    borderWidth: 2,
                    tension: 0.2
                }
            ]
        },
        options: {
            animation: false,
            responsive: true,
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: { title: { display: true, text: "Price" } }
            }
        }
    });
}
