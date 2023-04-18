function portfolio_entry(props) {
    return <div class="portfolio-entry">
        <span class="ticker">
            {props.ticker}
        </span>
        <span class="quantity">
            {props.quantity}
        </span>
        <span>
            <img src={props.performance.src} alt={props.performance.alt}>
            </img>
        </span>
        <span class="value">
            {props.value}
        </span>
        <span class="delta">
            {props.delta}
        </span>
    </div>;
}