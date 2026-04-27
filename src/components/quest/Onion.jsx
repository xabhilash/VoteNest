import './onion.css';

function Onion({ allAns, ind, ans, signed, onion, setOnion }) {
  let wid = '0%';
  let disPercent = 0;
  if (allAns.answers.length > 0) {
    let temp = allAns.answers[ind] / allAns.totalAnswers;
    temp *= 100;
    disPercent = Math.trunc(temp);
    wid = String(temp) + '%';
    if (temp === NaN) temp = 0;
  }

  return (
    <div
      className="onion-box"
      style={ind === ans
        ? { borderColor: '#12426d', borderWidth: '2px' }
        : { borderColor: 'rgb(82, 81, 81)' }}
      onClick={() => setOnion(ind)}
    >
      <div
        className="color-box"
        style={wid === '100%'
          ? { borderTopRightRadius: '7px', borderBottomRightRadius: '7px', width: wid }
          : { width: wid }}
      ></div>
      <p className="noselect">{onion}</p>
      <p
        className="display-percent"
        style={signed ? {} : { display: 'none' }}
      >{disPercent + '%'}</p>
    </div>
  );
}

export default Onion;
