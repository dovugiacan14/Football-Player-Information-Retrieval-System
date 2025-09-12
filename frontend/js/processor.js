class PlayerFootballLoadDataHandle {
    static searchPlayer(data) {
        const query = pageElement.$queryEle.val().trim();
        const topK = parseInt(pageElement.$topK.val());
        const searchType = pageElement.$searchType.val();

        // Validation
        if (!query) {
            pageElement.$queryEle.focus();
            PlayerFootballCommonFunction.showError('Please enter a search query');
            return;
        }

        if (topK < 1 || topK > 50) {
            pageElement.$topK.focus();
            PlayerFootballCommonFunction.showError('Number of results must be between 1 and 50');
            return;
        }

        // Handle to load Data
        if (!data || data.length === 0) {
            console.error("No data available");
            return;
        }

        pageElement.$resultSection.show();
        pageElement.$detailSection.show();
        const mainPlayer = data[0];
        this.displayMainPlayer(mainPlayer);

        // get remaining player to build similar players
        const similarPlayers = data.slice(1);
        this.displaySimilarPlayers(similarPlayers, mainPlayer?.player_data?.fullName || "Unknown Player");
        //
        // // create radar chart
        this.createRadarChart(mainPlayer);
    }

    static displayMainPlayer(playerData) {
        const player = playerData?.player_data || {};
        const seasonStats = player?.season_statistics[0] || {};

        // load basic information
        pageElement.$playerName.text(player?.fullName || "Unknown Player");
        pageElement.$playerNation.text(player?.nationality || "N/A");
        pageElement.$playerBorn.text(PlayerFootballCommonFunction.formatDate(player?.dateOfBirth) || "N/A");
        pageElement.$playerAge.text(player?.age || "N/A");
        pageElement.$playerSquad.text(player?.current_club?.clubName || "N/A");
        pageElement.$playerPosition.text(player?.position || "N/A");

        // update statistical
        pageElement.$assists.text(player?.totalAssists || 0);
        pageElement.$goals.text(player?.totalGoals || 0);
        pageElement.$scaEle.text(seasonStats?.expectedAssists || 'N/A');

        // information detail
        pageElement.$playerMinutes.text(seasonStats?.minutesPlayed || 'N/A');
        pageElement.$playerGoalDetail.text(player?.totalGoals || 0);
        pageElement.$playerProgressive.text(seasonStats?.passesCompleted ?
            (seasonStats.passesCompleted / (seasonStats?.minutesPlayed / 90)).toFixed(1) : 'N/A');
        pageElement.$playerAvgPassing.text(seasonStats?.passesCompleted || 'N/A');
        pageElement.$playeAerial.text(seasonStats?.aerialDuelsWon || 'N/A');
        pageElement.$playerApperance.text(player?.totalAppearances || 0);


        // update player image
        const photoUrl = `https://via.placeholder.com/150x200?text=${encodeURIComponent(player?.firstName)}`;
        pageElement.playerPhoto.attr('src', photoUrl).attr('alt', player?.fullName);

        // update header result
        pageElement.$resultHeader.html(`
            <h2>Search Results</h2>
            <p>Found ${data.length} players matching your query</p>
        `);
    }

    static displaySimilarPlayers(similarPlayers = [], mainPlayerName) {
        pageElement.$similarPlayerName.text(mainPlayerName);
        pageElement.$similarPlayerBody.empty();   // clear old data

        similarPlayers.forEach((playerData, index) => {
            const player = playerData?.player_data;
            const row = $(`
                <tr>
                    <td class="rank-cell">${index + 2}</td>
                    <td class="player-name">${player?.fullName || "NA"}</td>
                    <td>${player?.nationality || "NA"}</td>
                    <td>${player?.current_club?.clubName || "NA"}</td>
                    <td>${player?.position || "NA"}</td>
                    <td>${player?.age || "NA"}</td>
                </tr>
            `);

            // add event to show player detail
            row.on('click', () => {
                this.displayMainPlayer(playerData);
                this.displaySimilarPlayers(
                    [data[0], ...similarPlayers.filter((_, i) => i !== index)],
                    player?.fullName
                );
            });

            pageElement.$similarPlayerBody.append(row);
        });
    }

    static createRadarChart(playerData) {
        const player = playerData?.player_data || {};
        const averageStats = PlayerFootballCommonFunction.calculateAverageSeasonStats(player?.season_statistics || []);

        // prepare data for radar chart
        const chartData = {
            labels: [
                'Duels Won', 'Aerial Duels', 'Tackles', 'Interceptions',
                'Touches in Box', 'Passes', 'Expected Assists', 'Dribbles', 'Crosses'
            ],
            datasets: [
                {
                    label: player?.fullName,
                    data: [
                        PlayerFootballCommonFunction.normalizeValue(averageStats.duelsWon, 0, 150),
                        PlayerFootballCommonFunction.normalizeValue(averageStats.aerialDuelsWon, 0, 50),
                        PlayerFootballCommonFunction.normalizeValue(averageStats.tackles, 0, 80),
                        PlayerFootballCommonFunction.normalizeValue(averageStats.interceptions, 0, 50),
                        PlayerFootballCommonFunction.normalizeValue(averageStats.touchesInBox, 0, 2000),
                        PlayerFootballCommonFunction.normalizeValue(averageStats.passesCompleted, 0, 2500),
                        PlayerFootballCommonFunction.normalizeValue(averageStats.expectedAssists, 0, 15),
                        PlayerFootballCommonFunction.normalizeValue(averageStats.dribblesCompleted, 0, 100),
                        PlayerFootballCommonFunction.normalizeValue(averageStats.crossesCompleted, 0, 80)
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                }
            ]
        };

        const config = {
            type: 'radar',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {position: "bottom"}
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        };

        // remove old chart
        if (window.playerRadarChart) {
            window.playerRadarChart.destroy();
        }

        // create new chart
        const ctx = document.getElementById('radarChart').getContext('2d');
        window.playerRadarChart = new Chart(ctx, config);

        // update legend
        PlayerFootballCommonFunction.updateChartLegend(chartData.labels, [
            `${averageStats.duelsWon.toFixed(1)}`,
            `${averageStats.aerialDuelsWon.toFixed(1)}`,
            `${averageStats.tackles.toFixed(1)}`,
            `${averageStats.interceptions.toFixed(1)}`,
            `${averageStats.touchesInBox.toFixed(0)}`,
            `${averageStats.passesCompleted.toFixed(0)}`,
            `${averageStats.expectedAssists.toFixed(1)}`,
            `${averageStats.dribblesCompleted.toFixed(1)}`,
            `${averageStats.crossesCompleted.toFixed(1)}`
        ]);
    }
}


class PlayerFootballCommonFunction {
    static showError(message) {
        pageElement.$searchBtn.prop('disabled', false).html('🔍 Search Players');
        pageElement.$resultContainer.html(`<div class="error-message">${this.escapeHtml(message)}</div>`);
        pageElement.$resultSection.show();

        setTimeout(() => {
            if (pageElement.$resultContainer.html().includes('error-message')) {
                pageElement.$resultSection.hide();
            }
        }, 5000);
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static formatDate(dateString) {
        if (!dateString) {
            return null;
        }
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static calculateAverageSeasonStats(seasonStats) {
        // filter seasons have data
        const validSeasons = seasonStats.filter(season =>
            season?.minutesPlayed !== null && season?.minutesPlayed > 0
        );
        if (validSeasons.length === 0) {
            return {
                duelsWon: 0,
                aerialDuelsWon: 0,
                tackles: 0,
                interceptions: 0,
                touchesInBox: 0,
                passesCompleted: 0,
                expectedAssists: 0,
                dribblesCompleted: 0,
                crossesCompleted: 0
            }
        }

        // sum all valid seasons
        const totals = validSeasons.reduce((sum, season) => {
            return {
                duelsWon: sum.duelsWon || 0 + (season.duelsWon || 0),
                aerialDuelsWon: sum.aerialDuelsWon + (season?.aerialDuelsWon || 0),
                tackles: sum?.tackles + (season?.tackles || 0),
                interceptions: sum.interceptions + (season?.interceptions || 0),
                touchesInBox: sum.touchesInBox + (season?.touchesInBox || 0),
                passesCompleted: sum.passesCompleted + (season?.passesCompleted || 0),
                expectedAssists: sum.expectedAssists + (season?.expectedAssists || 0),
                dribblesCompleted: sum.dribblesCompleted + (season?.dribblesCompleted || 0),
                crossesCompleted: sum.crossesCompleted + (season?.crossesCompleted || 0)
            };
        }, {
            duelsWon: 0,
            aerialDuelsWon: 0,
            tackles: 0,
            interceptions: 0,
            touchesInBox: 0,
            passesCompleted: 0,
            expectedAssists: 0,
            dribblesCompleted: 0,
            crossesCompleted: 0
        });

        // calculate average
        const seasonCount = validSeasons.length;
        return {
            duelsWon: totals.duelsWon / seasonCount,
            aerialDuelsWon: totals.aerialDuelsWon / seasonCount,
            tackles: totals.tackles / seasonCount,
            interceptions: totals.interceptions / seasonCount,
            touchesInBox: totals.touchesInBox / seasonCount,
            passesCompleted: totals.passesCompleted / seasonCount,
            expectedAssists: totals.expectedAssists / seasonCount,
            dribblesCompleted: totals.dribblesCompleted / seasonCount,
            crossesCompleted: totals.crossesCompleted / seasonCount
        };
    }

    static normalizeValue(value, min, max) {
        return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    }

    static updateChartLegend(labels, values) {
        const legend = $('#chart-legend');
        legend.empty();

        labels.forEach((label, index) => {
            legend.append(`
                <div class="legend-item">
                    <span class="legend-label">${label}:</span>
                    <span class="legend-value">${values[index]}</span>
                </div>
            `);
        });
    }
}
