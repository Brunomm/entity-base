import {
  isObject,
  isBlank,
  isPresent,
  humanizeString,
  isString
} from './utils.js'

class Errors {
  constructor(model, messages={}) {
    this.model = model;
    this._messages = initialMessagesHandler(messages);
  }

  get messages(){
    return this._messages;
  }

  add(attr, message){
    if (this._messages[attr]){
      this._messages[attr].push( message );
    }else{
      this._messages[attr] = [message];
    }
    return this._messages[attr];
  }

  addJsonAPI(errors = []) {
    errors.forEach(error => this.add(error.field, error.detail))
  }

  clear(){
    this._messages = {};
  }

  fullMessages(args={}){
    const forceBase = Boolean(args.forceBase);

    const full = [];
    Object.keys(this.messages).forEach( (attr) => {
      const _msgs = this.messages[attr];
      if (Array.isArray(_msgs)){
        _msgs.forEach( (message) => {
          full.push(
            humanizeString(
              (`${this.model.hummanAttributeName(forceBase ? 'base' : attr)} ${message}`).trim()
            )
          );
        });
      }else{
        full.push(
          humanizeString(
            (`${this.model.hummanAttributeName(forceBase ? 'base' : attr)} ${_msgs}`).trim()
          )
        );
      }
    });
    return full;
  }

  isEmpty(){
    return Object.keys(this.messages).length === 0 && isBlank(this.messages?.base) ;
  }

  clone(){
    const _clone = {...this};
    Object.setPrototypeOf( _clone, this.constructor.prototype );
    return _clone;
  }
}

function initialMessagesHandler(msg){
  let messages = {};

  if( isObject(msg) ){
    messages = handleMessageObject( msg );
  }else if (Array.isArray(msg)){
    msg.forEach( (_msg) => {
      if ( isString(_msg) ){
        if (messages['base']){
          messages['base'].push(_msg);
        }else{
          messages['base'] = [_msg];
        }

      }else{
        messages = { ...messages, ...initialMessagesHandler(_msg) };
      }
    });
  }else if ( isPresent(msg) && typeof msg === 'string' || msg instanceof String){
    messages = {base: [msg.trim()]};
  }
  return messages;
}

function handleMessageObject(msg){
  const message = {base: []};
  Object.keys(msg).forEach( (key) => {
    if(/\[[\d]+\]/.test( key )){ // Identifica se a chave do erro contém um "array"
      message.base = [...message.base, ...msg[key] ];
    }else{
      message[key] = msg[key];
    }
  });
  return message;
}

export default Errors
