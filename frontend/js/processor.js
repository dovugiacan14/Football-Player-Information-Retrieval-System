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

        PlayerFootballCommonFunction.showLoading();
        this.displayResults(data);
    }

    static displayResults(data) {
        pageElement.$searchBtn.prop('disabled', false).html('🔍 Search Players');
        let playerName = data[0]?.player_data?.fullName || "Unknown Player";
        console.log("Display player:", playerName);

        pageElement.$playerName.text(playerName);
       
    }
}

class PlayerFootballCommonFunction {
    static showLoading() {
        pageElement.$searchBtn.prop('disabled', true).text('Searching...');
        pageElement.$resultSection.show();
        pageElement.$resultContainer.html('<div class="loading">Searching players...</div>');
        $('html, body').animate({
            scrollTop: pageElement.$resultSection.offset().top - 20
        }, 500);
    }

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
}
