import React from 'react';
import '../../components/Styles/CreateGame.css';

const CreateGame = () => {
    return (
        <div className="container">
            <div className="content">
                <h1 className="greenify">
                    <span className="green">Green</span>
                    <span className="ify">iFy</span>
                </h1>
                <h2 className="title-text">Create Game</h2>

                {/* form tag needs "onSubmit={TODO}" */}
                <form className="create-game-form" name="create-game-form">
                    <div class="row">
                        <div class="col">
                            <select id="game-type" name="game-type" className="game-type" form="create-game-form">
                                <option value="" disabled selected>Game Type</option>
                                <option value="S&P_Market_Buster">S&P Market Buster</option>
                            </select><br/>
                            <input type="number" id="money-market-fund" name="money-market-fund" className="money-market-fund" placeholder="Money Market Fund" min="0"></input>
                            <select id="sponsor" name="sponsor" className="sponsor" form="create-game-form">
                                <option value="" disabled selected>Sponsor</option>
                                <option value="sponsor">sponsor placeholder</option>
                            </select>
                        </div>
                        <div class="col">
                            <label className="date-label">Start date: </label>
                            <input type="datetime-local" name="start-date" className="start-date"/><br/>
                            <label className="date-label">End date: </label>
                            <input type="datetime-local" name="end-date" className="end-date"/>
                        </div>
                    </div>

                    <button name="submit-button" className="submit-button">Create Game</button>

                </form>

            </div>
        </div>
    )
}

export default CreateGame;