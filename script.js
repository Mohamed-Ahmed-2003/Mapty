"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const editForm = document.querySelector(".edit__form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

const inputTypeEdited = document.querySelector(".form__input--type--edited");
const inputDistanceEdited = document.querySelector(
  ".form__input--distance--edited"
);
const inputDurationEdited = document.querySelector(
  ".form__input--duration--edited"
);
const inputCadenceEdited = document.querySelector(
  ".form__input--cadence--edited"
);
const inputElevationEdited = document.querySelector(
  ".form__input--elevation--edited"
);
const mapArea = document.getElementById("map");
const markers = document.querySelectorAll("leaflet-marker-icon");
const btns_mod = document.querySelector(".btns");
const btn_deleteAll = document.querySelector(".btn-deleteAll");
const btn_sort = document.querySelector(".btn-sort-workouts");
const btn_fitMapPosition = document.querySelector(".btn-showsAll");

let identities = 0;
class Workout {
  constructor(distance, duration, coords) {
    this.id = ++identities;
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;

    this.date = new Date().toLocaleDateString(navigator.language, {
      month: "long",
      day: "numeric",
    });
  }
}
class Running extends Workout {
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.pace = duration / distance;
    this.type = "running";
    this.desc = `Running ${this.date}`;
  }
}

class Cycling extends Workout {
  constructor(distance, duration, coords, EG) {
    super(distance, duration, coords);
    this.EG = EG;
    this.speed = distance / (duration / 60);
    this.type = "cycling";
    this.desc = `Cycling ${this.date}`;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #markerVars = [];
  #markerCoords = [];
  #s = new Set();
  checkIN = true;
  #w_Edit_Index;
  constructor() {
    this._getPosition();
    this._getWorkoutsData();
    this._formSubmitEvent();
    this._formEditSubmitEvent();
    this._goMapEvent();
    this._inputTypeChangeINEvent();
    this._inputTypeChangeEvent();
    this._deleteAllEvent();
    this._removeElementEvent();
    this._editElementEvent();
    this._sortWorkoutsEvent();
    this._fitMapEvent();
  }
  ///////////////////
  /////////////////// extended functions
  ///////////////////
  _showForm() {
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    this.checkIN2 = false;
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 100);
  }
  _showEditForm() {
    editForm.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideEditForm() {
    this.checkIN2 = false;
    editForm.style.display = "none";
    editForm.classList.add("hidden");
    setTimeout(() => (editForm.style.display = "grid"), 100);
  }
  _clearVar() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
  }
  _inputTypeChangeINEvent() {
    inputType.addEventListener("change", this._toggleElevationField);
  }
  _renderAworkoutMarker(workout) {
    // save the elements in a set fo repetition avoiding then copy it to array for operations
    this.#s.add(
      L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(
          L.popup({
            minWidth: 200,
            maxWidth: 300,
            maxHeight: 140,
            className: `${workout.type}-popup`,
            closeOnClick: false,
            autoClose: false,
          }).setContent(
            `${workout.type === "running" ? `🏃🏽‍♂️` : `🚴🏽`}${workout.desc}`
          ) // setPopupContent
        )
        .openPopup()
    );
    this.#markerVars = Array.from(this.#s);
  }
  //_DeleteRenderAworkoutMarker(workout) {}
  _renderWorkout(workout) {
    const htmlCont = `
    <div class="workout-box">
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.desc}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === "running" ? "🏃🏽‍♂️" : "🚴🏽"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${
        workout.type === "running"
          ? workout.pace.toFixed(1)
          : workout.speed.toFixed(1)
      }</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === "running" ? "👟" : "📈"
      }</span>
      <span class="workout__value">${
        workout.type === "running" ? workout.cadence : workout.EG
      }</span>
      <span class="workout__unit">${
        workout.type === "running" ? "SPM" : "M"
      }</span>
    </div>
      </li>
      <div class="opt-menu">
      <button class="btn btn_edit" title="Edit">✏️</button>
      <button class="btn btn_remove" title="remove">❌</button>
    </div>
    </div>  `;
    editForm.insertAdjacentHTML("afterend", htmlCont);
  }
  _goMapEvent() {
    containerWorkouts.addEventListener("click", this._goMap.bind(this));
  }
  ///////////////////
  /////////////////// callBack functions
  ///////////////////
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),

      () => {
        alert("go to settings and allow location");
      }
    );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 12);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._mapClicked.bind(this));

    this.#workouts.forEach((w) => {
      this._renderAworkoutMarker(w);
    });
  }

  _mapClicked(m) {
    this.checkIN = true;
    this.#mapEvent = m;
    this._showForm();
  }

  _toggleElevationField(newData = true) {
    if (!newData) {
      inputCadenceEdited
        .closest(".form__row")
        .classList.toggle("form__row--hidden");
      inputElevationEdited
        .closest(".form__row")
        .classList.toggle("form__row--hidden");
      return;
    }
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _changeTypeOnClickEdit(ty) {
    if (ty === "cycling") {
      inputCadenceEdited
        .closest(".form__row")
        .classList.add("form__row--hidden");
      inputElevationEdited
        .closest(".form__row")
        .classList.remove("form__row--hidden");
    } else if (ty === "running") {
      inputCadenceEdited
        .closest(".form__row")
        .classList.remove("form__row--hidden");
      inputElevationEdited
        .closest(".form__row")
        .classList.add("form__row--hidden");
    }
  }
  _formSubmitEvent() {
    form.addEventListener("submit", this._newWorkout.bind(this));
  }

  _newWorkout(v) {
    v.preventDefault();
    if (!this.checkIN) return;
    const type = inputType.value;
    const ty = type === "running" ? +inputCadence.value : +inputElevation.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const coords = [this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng];
    let workout;
    if (
      !distance ||
      !duration ||
      !ty ||
      duration <= 0 ||
      distance <= 0 ||
      (ty <= 0 && type === "running")
    ) {
      alert("enter correct inputs");
      this._clearVar();
      return;
    }
    this._clearVar();
    // create a workout object
    workout =
      type === "running"
        ? new Running(distance, duration, coords, ty)
        : new Cycling(distance, duration, coords, ty);

    // add the crated workout to workouts array
    this.#workouts.push(workout);
    this._sotreWorkoutsData();

    // render a marker
    this._renderAworkoutMarker(workout);
    // render a workout desc box on sidebar
    this._renderWorkout(workout);
    this._hideForm();
    this._showOrHideModMenu();
  }
  _goMap(e) {
    if (!this.#map) return;
    const w = e.target.closest(".workout");
    if (!w) return;
    const Index = +w.getAttribute("data-id");
    // FOUND the clicked object
    const workoutF = this.#workouts.find((w) => w.id === Index);
    // go to map  set&zoom
    this.#map.setView(workoutF.coords, 15, {
      animate: true,
      duration: 1,
    });
  }
  _sotreWorkoutsData() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getWorkoutsData() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    this._showOrHideModMenu();
    if (!data) return;

    const thisApp = this;
    // rebuild objects to original
    data.forEach(function (el, i) {
      const originalElement =
        el.type === "running"
          ? new Running(el.distance, el.duration, el.coords, el.cadence)
          : new Cycling(el.distance, el.duration, el.coords, el.EG);
      thisApp.#workouts.push(originalElement);
    });

    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });

    this._showOrHideModMenu();
  }

  _showOrHideModMenu() {
    if (this.#workouts.length > 1) btns_mod.classList.remove("btn_hidden");
    else btns_mod.classList.add("btn_hidden");
  }
  _deleteAll(e) {
    e.preventDefault();

    if (!confirm("Are you sure you want to delete all element?")) return;
    localStorage.removeItem("workouts");
    location.reload();
  }
  _deleteAllEvent() {
    btn_deleteAll.addEventListener("click", this._deleteAll.bind(this));
  }

  _removeMarkers(workout) {
    this.#map.removeLayer(workout);
  }
  _removeElement(e) {
    if (!e.target.classList.contains("btn_remove")) return;

    const workoutBox = e.target.closest(".workout-box");
    const workout = workoutBox.firstElementChild;

    const d_Id = +workout.getAttribute("data-id");
    // FOUND the clicked object
    const workoutIndex = this.#workouts.findIndex((w, i) => w.id === d_Id);
    if (!confirm("Are you sure you want to remove this element?")) return;

    this.#workouts.splice(workoutIndex, 1);
    workoutBox.remove();
    this._sotreWorkoutsData();
    this._showOrHideModMenu();
    // remove markers from thhe array
    this._removeMarkers(this.#markerVars[workoutIndex]);
    this.#markerVars.splice(workoutIndex, 1);
    // make the set equal the updated array
    this.#s = new Set([...this.#markerVars]);
  }

  _removeElementEvent() {
    containerWorkouts.addEventListener("click", this._removeElement.bind(this));
  }
  _inputTypeChangeEvent() {
    inputTypeEdited.addEventListener(
      "change",
      this._toggleElevationField.bind(this, false)
    );
  }
  _editElement(e) {
    if (!e.target.classList.contains("btn_edit")) return;
    const workoutBox = e.target.closest(".workout-box");
    const workout = workoutBox.firstElementChild;

    const d_Id = +workout.getAttribute("data-id");
    const workoutIndex = (this.#w_Edit_Index = this.#workouts.findIndex(
      (w) => w.id === d_Id
    ));
    const type = this.#workouts[workoutIndex].type;
    // Putting values ​​on the editor's format labels
    inputDistanceEdited.value = this.#workouts[workoutIndex].distance;
    inputDurationEdited.value = this.#workouts[workoutIndex].duration;

    if (type === "cycling") {
      this._changeTypeOnClickEdit(type);
      inputElevationEdited.value = this.#workouts[workoutIndex].EG;
      inputCadenceEdited.value = "";
    } else {
      this._changeTypeOnClickEdit(type);
      inputCadenceEdited.value = this.#workouts[workoutIndex].cadence;
      inputElevationEdited.value = "";
    }
    inputTypeEdited.value = type;
    this._showEditForm();
  }

  _editElementEvent() {
    containerWorkouts.addEventListener("click", this._editElement.bind(this));
  }
  _formEditSubmit(e) {
    e.preventDefault();
    const dist = +inputDistanceEdited.value,
      dur = +inputDurationEdited.value,
      ty = inputTypeEdited.value,
      coords = this.#workouts[this.#w_Edit_Index].coords;

    if (ty === "cycling")
      this.#workouts[this.#w_Edit_Index] = new Cycling(
        dist,
        dur,
        coords,
        +inputElevationEdited.value
      );
    else
      this.#workouts[this.#w_Edit_Index] = new Running(
        dist,
        dur,
        coords,
        +inputCadenceEdited.value
      );
    this._hideEditForm();
    this._sotreWorkoutsData();
    location.reload();
  }
  _formEditSubmitEvent() {
    editForm.addEventListener("submit", this._formEditSubmit.bind(this));
  }
  _sortWorkouts(e) {
    e.preventDefault();
    const sortedArray = this.#workouts.slice();
    // we should define it  here where  the list has been created before its declareation
    const workoutsBoxes = document.querySelectorAll(".workout-box");

    // remove un orderd workouts list from html
    workoutsBoxes.forEach((el) => el.remove());
    // the array order based on distance
    sortedArray.sort((a, b) => a.distance - b.distance);
    // putting the sorted array on html
    sortedArray.forEach((el) => this._renderWorkout(el));
  }
  _sortWorkoutsEvent() {
    btn_sort.addEventListener("click", this._sortWorkouts.bind(this));
  }
  _fitMap() {
    // save all markers coordinates to array then pass it to fitBounds to fit the map position
    this.#markerCoords = this.#markerVars.map((mark) => {
      const { lat, lng } = mark._latlng;
      return [lat, lng];
    });
    this.#map.fitBounds(this.#markerCoords);
    // this.#map.fitBounds([
    //   [30.19640448107397, 31.18826207369679],
    //   [31.15222857773407, 36.66387289268768],
    //   [37.477449668711216, 28.602774329455848],
    // ]);
  }
  _fitMapEvent() {
    btn_fitMapPosition.addEventListener("click", this._fitMap.bind(this));
  }
}

const app = new App();
