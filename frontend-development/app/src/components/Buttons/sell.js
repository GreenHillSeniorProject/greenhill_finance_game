document.addEventListener('DOMContentLoaded', () => {
    const sellButton = createButton('Sell', 20, 130);
    document.body.appendChild(sellButton);
});

function createButton(text, top, left, textColor) {
    const button = document.createElement('button');
    button.textContent = text;

    const buttonStyles = `
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        width: 92px;
        height: 39px;
        position: absolute;
        top: ${top}px;
        left: ${left}px;
        border: none;
        border-radius: 10px;
        background-color: #000000;
        color: ${textColor};
        font-size: 16px;
        cursor: pointer;
        transition: 0.3s;
    `;
    button.style.cssText = buttonStyles;

    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#333333';
    });

    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#000000';
    });

    return button;
}
document.addEventListener('DOMContentLoaded', () => {
    const sellButton = createButton('Sell', 20, 130, '#FF0000'); 
    document.body.appendChild(sellButton);
});
