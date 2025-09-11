// $(document).ready(() => {
//     EventHandler.initPageEvent();
// });

$(document).ready(function () {
    $("#search-btn").on("click", function () {
        // show results section
        $("#results-section").show();
        $("#results-container").empty();

        // loop qua data để render danh sách
        data.forEach(player => {
            const p = player.player_data;
            const card = $(`
                <div class="player-card" data-id="${p.playerId}">
                    <h3>${p.fullName}</h3>
                    <p><b>Nation:</b> ${p.nationality}</p>
                    <p><b>Position:</b> ${p.position}</p>
                </div>
            `);
            $("#results-container").append(card);
        });
    });

    // event click vào player-card
    $(document).on("click", ".player-card", function () {
        const id = $(this).data("id");
        const player = data.find(d => d.player_data.playerId === String(id)).player_data;

        // hiện section detail
        $("#player-detail-section").show();

        // fill thông tin cơ bản
        $("#player_name").text(player.fullName);
        $("#player_nation").text(player.nationality);
        $("#player_age").text(player.age);
        $("#player_position").text(player.position);
        $("#player_minutes").text(player.season_statistics[0]?.minutesPlayed || "N/A");
        $("#player_goals_detail").text(player.season_statistics[0]?.goals || 0);
        $("#stat_goals").text(player.career_goals || 0);
        $("#stat_assists").text(player.career_assists || 0);
        $("#stat_sca").text(player.season_statistics[0]?.touchesInBox || 0);

        // ảnh tạm cho vui (nếu không có link ảnh trong data)
        $("#player_photo").attr("src", "https://via.placeholder.com/150?text=Player");
    });
});